import { v7 } from "uuid";
import {
  listUsers,
  getSweepSettings,
  setSweepSettings,
  createSweepTask,
  updateSweepTask,
} from "../utils/storage";
import {
  getUsdtBalance,
  getTrxBalance,
  estimateTrc20Fee,
  buildUnsignedTrxTransfer,
  buildUnsignedUsdtTransfer,
  extractTxId,
  attachSignature,
  broadcast,
  getTransactionInfo,
} from "../services/tron";
import { signWithMpc } from "../services/mpc";
import { serverConfig } from "../utils/runtime-config";
import { logger } from "../utils/logger";
import type { SweepTask, SweepItem, SweepSettings } from "../../shared/types";
import { TronWeb } from "tronweb";

const SWEEP_LOCK_KEY = "sweep:cron:lock";
const SWEEP_LOCK_TTL = 10 * 60 * 1000; // 10 分钟，防止进程崩溃锁永不释放
const SWEEP_GLOBAL_TIMEOUT = 30 * 60 * 1000;

async function acquireSweepLock(): Promise<boolean> {
  const sweeps = useStorage("sweeps");
  const existing = (await sweeps.getItem(SWEEP_LOCK_KEY)) as number | null;
  if (existing && Date.now() - existing < SWEEP_LOCK_TTL) return false;
  await sweeps.setItem(SWEEP_LOCK_KEY, Date.now());
  return true;
}

async function releaseSweepLock(): Promise<void> {
  const sweeps = useStorage("sweeps");
  await sweeps.removeItem(SWEEP_LOCK_KEY);
}

// === Helpers ===

async function getGasPrivateKey(): Promise<string | null> {
  const envKey = serverConfig.gasPoolPrivateKey;
  if (envKey) return envKey;
  const settings = await getSweepSettings();
  return settings?.gasPoolPrivateKey ?? null;
}

async function getGasPoolAddress(): Promise<string> {
  const key = await getGasPrivateKey();
  if (!key) throw new Error("Gas pool private key not configured");
  const tronWeb = new TronWeb({ fullHost: "https://nile.trongrid.io", privateKey: key });
  return (tronWeb.defaultAddress as any).base58 as string;
}

async function waitForTransaction(
  txHash: string,
  network: "nile" | "mainnet",
  timeoutMs = 180_000,
): Promise<boolean> {
  let delay = 1000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const info = await getTransactionInfo(txHash, network);
      if (info && info.blockNumber) {
        logger.info("交易已确认", { txHash, blockNumber: info.blockNumber });
        return true;
      }
    } catch {
      // 尚未确认
    }
    delay = Math.min(delay * 2, 30_000);
  }

  logger.error("交易确认超时", { txHash, timeoutMs });
  return false;
}

// === Sub-tasks ===

interface SweepConfig {
  settings: SweepSettings;
  gasKey: string;
  gasPoolAddress: string;
  network: "nile" | "mainnet";
}

async function validateSweepSettings(): Promise<SweepConfig | null> {
  const settings = await getSweepSettings();

  if (!settings.enabled) {
    logger.info("归集未启用，跳过");
    return null;
  }
  if (!settings.targetAddress) {
    logger.warn("未设置归集目标地址，跳过");
    return null;
  }

  const gasKey = settings.gasPoolPrivateKey || (await getGasPrivateKey());
  if (!gasKey) {
    logger.warn("未设置 Gas 池私钥，跳过");
    return null;
  }

  const gasPoolAddress = await getGasPoolAddress();
  const network = serverConfig.tronNetwork;

  return { settings, gasKey, gasPoolAddress, network };
}

// === Settings update ===

export interface SweepSettingsUpdate {
  sweepTargetAddress?: string;
  sweepGasPoolPrivateKey?: string;
  sweepThreshold?: number;
  sweepGasTrxAmount?: number;
  sweepIntervalMinutes?: number;
  sweepEnabled?: boolean;
}

export async function applySweepSettings(data: SweepSettingsUpdate): Promise<void> {
  const current = await getSweepSettings();
  let changed = false;
  const set = <K extends keyof SweepSettings>(field: K, value: SweepSettings[K] | undefined) => {
    if (value === undefined) return;
    current[field] = value;
    changed = true;
  };

  set("targetAddress", data.sweepTargetAddress);
  if (data.sweepGasPoolPrivateKey !== undefined) {
    set("gasPoolPrivateKey", data.sweepGasPoolPrivateKey || null);
  }
  set("threshold", data.sweepThreshold);
  set("gasTrxAmount", data.sweepGasTrxAmount);
  set("intervalMinutes", data.sweepIntervalMinutes);
  set("enabled", data.sweepEnabled);

  if (changed) await setSweepSettings(current);
}

interface Candidate {
  userId: string;
  address: string;
}

async function findCandidates(
  threshold: number,
  network: "nile" | "mainnet",
): Promise<Candidate[]> {
  const users = await listUsers();
  const candidates: Candidate[] = [];

  for (const user of users) {
    if (!user.depositAddress) continue;
    try {
      const balance = await getUsdtBalance(user.depositAddress, network);
      const balanceMicro = Number(balance.raw);
      if (balanceMicro >= threshold) {
        candidates.push({ userId: user.id, address: user.depositAddress });
      }
    } catch (error) {
      logger.error("查询用户余额失败", {
        userId: user.id,
        address: user.depositAddress,
        error: String(error),
      });
    }
  }

  return candidates;
}

interface GasCheckResult {
  items: SweepItem[];
  totalGasNeeded: number;
}

async function getTrxBalanceAndFee(
  address: string,
  network: "nile" | "mainnet",
): Promise<{ trxBalance: number; estimatedFee: number }> {
  const { sun: trxSun } = await getTrxBalance(address, network);
  const estimatedFee = await estimateTrc20Fee(address, network);
  return { trxBalance: Number(trxSun), estimatedFee };
}

async function preCheckGas(candidates: Candidate[], config: SweepConfig): Promise<GasCheckResult> {
  const items: SweepItem[] = [];
  let totalGasNeeded = 0;

  for (const c of candidates) {
    const item: SweepItem = {
      userId: c.userId,
      address: c.address,
      amount: 0,
      gasTxHash: null,
      txHash: null,
      status: "pending",
      error: null,
    };

    try {
      const usdtBalance = await getUsdtBalance(c.address, config.network);
      item.amount = Number(usdtBalance.raw);

      const { trxBalance, estimatedFee } = await getTrxBalanceAndFee(c.address, config.network);

      if (trxBalance < estimatedFee) {
        const needed = Math.max(config.settings.gasTrxAmount, Math.ceil(estimatedFee * 1.2));
        totalGasNeeded += needed;
      }
    } catch (error) {
      item.status = "skipped";
      item.error = String(error);
      logger.error("预检失败", { userId: c.userId, address: c.address, error: String(error) });
    }

    items.push(item);
  }

  return { items, totalGasNeeded };
}

async function processGasRefill(
  items: SweepItem[],
  config: SweepConfig,
  checkTimeout: (label: string) => void,
): Promise<void> {
  const tronWeb = new TronWeb({ fullHost: "https://nile.trongrid.io", privateKey: config.gasKey });

  for (const item of items) {
    checkTimeout("补 Gas 循环");
    if (item.status === "skipped" || item.status === "failed") continue;

    try {
      const { trxBalance, estimatedFee } = await getTrxBalanceAndFee(item.address, config.network);

      if (trxBalance < estimatedFee) {
        const needed = Math.max(config.settings.gasTrxAmount, Math.ceil(estimatedFee * 1.2));

        logger.info("补充 Gas", { address: item.address, needed, trxBalance });

        const gasTx = await buildUnsignedTrxTransfer(
          config.gasPoolAddress,
          item.address,
          needed,
          config.network,
        );
        const signedGasTx = await tronWeb.trx.sign(gasTx);
        const gasResult = await broadcast(signedGasTx, config.network);

        item.gasTxHash = gasResult.txid || gasResult.txID;
        item.status = "gas_sent";

        const confirmed = await waitForTransaction(item.gasTxHash!, config.network);
        if (!confirmed) {
          item.status = "failed";
          item.error = "Gas 交易确认超时";
          continue;
        }

        const { sun: newTrxSun } = await getTrxBalance(item.address, config.network);
        if (Number(newTrxSun) < estimatedFee) {
          item.status = "failed";
          item.error = "补 Gas 后 TRX 仍不足";
          continue;
        }
      }
    } catch (error) {
      item.status = "failed";
      item.error = String(error);
      logger.error("补充 Gas 失败", { userId: item.userId, error: String(error) });
    }
  }
}

async function processUsdtSweep(
  items: SweepItem[],
  users: { id: string; mpcWalletId: string | null; depositAddress: string | null }[],
  config: SweepConfig,
  task: SweepTask,
  checkTimeout: (label: string) => void,
): Promise<void> {
  for (const item of items) {
    checkTimeout("归集循环");
    if (item.status === "skipped" || item.status === "failed") continue;

    try {
      const usdtTx = await buildUnsignedUsdtTransfer(
        item.address,
        config.settings.targetAddress,
        item.amount,
        config.network,
      );
      const txIdHex = extractTxId(usdtTx);

      const user = users.find((u) => u.id === item.userId);
      if (!user || !user.mpcWalletId) {
        item.status = "failed";
        item.error = "用户无 MPC 钱包";
        continue;
      }

      logger.info("归集签名前检查", {
        userId: user.id,
        mpcWalletId: user.mpcWalletId,
        depositAddress: user.depositAddress,
        sweepFromAddress: item.address,
        match: user.depositAddress === item.address,
      });

      const networkCode = "tron:mainnet";
      const sig = await signWithMpc(user.mpcWalletId, txIdHex, networkCode);

      const signedTx = attachSignature(usdtTx, sig.r, sig.s, sig.recovery);
      const result = await broadcast(signedTx, config.network);

      item.txHash = result.txid || result.txID;
      item.status = "done";

      logger.info("归集交易完成", {
        userId: item.userId,
        address: item.address,
        txHash: item.txHash,
      });
    } catch (error) {
      item.status = "failed";
      item.error = String(error);
      logger.error("归集项失败", { userId: item.userId, error: String(error) });
    }

    await updateSweepTask(task);
  }
}

// === Main entry ===

export async function runSweep(): Promise<SweepTask | null> {
  const locked = await acquireSweepLock();
  if (!locked) {
    logger.warn("归集任务正在运行（分布式锁），跳过");
    return null;
  }

  const startTime = Date.now();
  const checkTimeout = (label: string) => {
    if (Date.now() - startTime > SWEEP_GLOBAL_TIMEOUT) {
      throw new Error(`归集全局超时: ${label}`);
    }
  };

  try {
    const config = await validateSweepSettings();
    if (!config) {
      await releaseSweepLock();
      return null;
    }

    logger.info("开始归集任务", {
      targetAddress: config.settings.targetAddress,
      threshold: config.settings.threshold,
    });

    // 第 1 步：查找候选地址
    const candidates = await findCandidates(config.settings.threshold, config.network);
    if (candidates.length === 0) {
      logger.info("没有地址需要归集，跳过");
      config.settings.lastRunAt = Date.now();
      await setSweepSettings(config.settings);
      return null;
    }

    const taskId = v7();
    const task: SweepTask = {
      id: taskId,
      status: "running",
      targetAddress: config.settings.targetAddress,
      threshold: config.settings.threshold,
      totalAmount: 0,
      items: [],
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
    };
    await createSweepTask(task);
    logger.info("找到候选地址", { count: candidates.length });

    // 第 2 步：预检 Gas
    const { items, totalGasNeeded } = await preCheckGas(candidates, config);
    task.items = items;

    const { sun: gasPoolSun } = await getTrxBalance(config.gasPoolAddress, config.network);
    const gasPoolBalance = Number(gasPoolSun);

    if (totalGasNeeded > gasPoolBalance) {
      task.status = "failed";
      task.error = `Gas 池余额不足：需要 ${totalGasNeeded} SUN，持有 ${gasPoolBalance} SUN`;
      task.finishedAt = Date.now();
      await updateSweepTask(task);
      logger.error("归集失败：Gas 池余额不足", { totalGasNeeded, gasPoolBalance });
      return task;
    }

    // 第 3 步：补充 Gas
    await processGasRefill(items, config, checkTimeout);

    // 第 4 步：归集 USDT
    const users = await listUsers();
    await processUsdtSweep(items, users, config, task, checkTimeout);

    // 第 5 步：收尾
    const allDone = items.every((i) => i.status === "done" || i.status === "skipped");
    task.status = allDone ? "done" : "failed";
    task.totalAmount = items.reduce((sum, i) => sum + (i.status === "done" ? i.amount : 0), 0);
    task.finishedAt = Date.now();
    await updateSweepTask(task);

    config.settings.lastRunAt = Date.now();
    await setSweepSettings(config.settings);

    logger.info("归集任务完成", { taskId, status: task.status, totalAmount: task.totalAmount });
    return task;
  } catch (error) {
    logger.error("归集任务异常", { error: String(error) });
    return null;
  } finally {
    await releaseSweepLock();
  }
}

export async function markInterruptedTasks(): Promise<void> {
  const { listSweepTasks } = await import("../utils/storage");
  const result = await listSweepTasks(100);
  for (const task of result.items) {
    if (task.status === "running") {
      task.status = "interrupted";
      task.error = "进程重启，任务中断";
      task.finishedAt = Date.now();
      await updateSweepTask(task);
      logger.warn("标记中断任务", { taskId: task.id });
    }
  }
}
