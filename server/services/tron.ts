import { TronWeb } from "tronweb";
import { logger } from "../utils/logger";
import { serverConfig } from "../utils/runtime-config";

function getApiKey(): string {
  return serverConfig.trongridApiKey || "";
}

class ConcurrencyLimiter {
  private running = 0;
  private queue: (() => void)[] = [];

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) {
      this.running++;
      next();
    }
  }

  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const msg = String(error);
      const is429 = msg.includes("429") || msg.includes("Too Many Requests");
      if (!is429 || attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn(`限流重试: ${label}`, { attempt: attempt + 1, delay });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("unreachable");
}

const tronLimiter = new ConcurrencyLimiter(5);

const networks = {
  mainnet: {
    tronGridBaseUrl: "https://api.trongrid.io",
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  },
  nile: {
    tronGridBaseUrl: "https://nile.trongrid.io",
    contractAddress: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
  },
} as const;

export type TronNetwork = keyof typeof networks;

const tronClients = new Map<string, any>();

function getTronClient(network: TronNetwork): any {
  const existing = tronClients.get(network);
  if (existing) return existing;

  const config = networks[network];
  logger.info("创建Tron客户端", { network, url: config.tronGridBaseUrl });

  const apiKey = getApiKey();

  const client = new TronWeb({
    fullHost: config.tronGridBaseUrl,
    privateKey: "01",
  });

  if (apiKey) {
    client.setHeader({ "TRON-PRO-API-KEY": apiKey });
    client.setFullNodeHeader({ "TRON-PRO-API-KEY": apiKey });
  }

  tronClients.set(network, client);
  return client;
}

export async function getTrxBalance(address: string, network: TronNetwork) {
  const tronWeb = getTronClient(network);
  try {
    const balanceSun = (await tronLimiter.wrap(() =>
      withRetry(() => tronWeb.trx.getBalance(address), `TRX余额 ${address}`),
    )) as any;
    logger.info("查询TRX余额", { address, network, balanceSun: balanceSun.toString() });
    return { sun: balanceSun.toString(), trx: TronWeb.fromSun(balanceSun as number) };
  } catch (error) {
    logger.error("查询TRX余额失败", { address, network, error: String(error) });
    throw error;
  }
}

export async function getUsdtBalance(address: string, network: TronNetwork) {
  const tronWeb = getTronClient(network);
  const { contractAddress } = networks[network];

  try {
    const raw = await tronLimiter.wrap(() =>
      withRetry(async () => {
        const contract = await tronWeb.contract().at(contractAddress);
        const balance = await contract.balanceOf(address).call();
        return TronWeb.toBigNumber(balance).toString();
      }, `USDT余额 ${address}`),
    );
    logger.info("查询USDT余额", { address, network, raw });
    return { raw, usdt: TronWeb.toBigNumber(raw).div(1e6).toString() };
  } catch (error) {
    logger.error("查询USDT余额失败", { address, network, error: String(error) });
    throw error;
  }
}

export async function buildUnsignedTrxTransfer(
  from: string,
  to: string,
  amountSun: number,
  network: TronNetwork,
) {
  const tronWeb = getTronClient(network);
  logger.info("构建TRX转账", { from, to, amountSun, network });

  const tx = await tronWeb.transactionBuilder.sendTrx(to, amountSun, from);
  return tx;
}

export async function buildUnsignedUsdtTransfer(
  from: string,
  to: string,
  amount: number,
  network: TronNetwork,
) {
  const tronWeb = getTronClient(network);
  const { contractAddress } = networks[network];
  logger.info("构建USDT转账", { from, to, amount, network, contractAddress });

  const tx = await tronWeb.transactionBuilder.triggerSmartContract(
    contractAddress,
    "transfer(address,uint256)",
    {},
    [
      { type: "address", value: to },
      { type: "uint256", value: String(amount) },
    ],
    from,
  );

  return tx;
}

function getInnerTx(tx: any): any {
  return tx.transaction || tx;
}

export function extractTxId(tx: any): string {
  const inner = getInnerTx(tx);
  const txId = inner.txID;
  logger.info("提取txID", { txId });
  if (!txId) {
    throw new Error("无法提取交易ID");
  }
  return txId;
}

export function attachSignature(tx: any, r: string, s: string, recovery: number) {
  const rPadded = r.padStart(64, "0");
  const sPadded = s.padStart(64, "0");
  const v = (recovery + 27).toString(16).padStart(2, "0");
  const signature = rPadded + sPadded + v;

  const inner = getInnerTx(tx);

  if (Array.isArray(inner.signature)) {
    inner.signature.push(signature);
  } else {
    inner.signature = [signature];
  }

  logger.info("签名已附加", { signatureLen: signature.length });
  return tx;
}

export async function broadcast(signedTx: any, network: TronNetwork) {
  const tronWeb = getTronClient(network);
  logger.info("广播交易", { network });

  const inner = getInnerTx(signedTx);
  const result = await tronWeb.trx.sendRawTransaction(inner);
  logger.info("交易广播成功", { result });
  return result;
}

export async function getTransactionInfo(txid: string, network: TronNetwork) {
  const tronWeb = getTronClient(network);
  logger.info("查询交易回执", { txid, network });

  try {
    const info = await tronWeb.trx.getTransactionInfo(txid);
    logger.info("交易回执结果", { txid, info });
    return info;
  } catch (error) {
    logger.error("查询交易回执失败", { txid, network, error: String(error) });
    throw error;
  }
}

export async function estimateTrc20Fee(
  senderAddress: string,
  network: TronNetwork,
): Promise<number> {
  const tronWeb = getTronClient(network);
  const { contractAddress } = networks[network];

  const [chainParams, energyResult] = await Promise.all([
    tronWeb.trx.getChainParameters(),
    tronWeb.transactionBuilder.estimateEnergy(
      contractAddress,
      "transfer(address,uint256)",
      {},
      [
        { type: "address", value: senderAddress },
        { type: "uint256", value: "1" },
      ],
      senderAddress,
    ),
  ]);

  let energyFee = 0;
  for (const param of chainParams) {
    if (param.key === "getEnergyFee") {
      energyFee = param.value ?? 0;
      break;
    }
  }

  if (energyFee === 0) {
    energyFee = network === "mainnet" ? 420 : 420;
    logger.warn("未能获取能量费率，使用默认值", { energyFee });
  }

  const energyRequired = (energyResult as any)?.energy_required ?? 0;
  const estimatedFee = Math.ceil(energyRequired * energyFee * 1.2);

  logger.info("估算USDT转账费用", { energyRequired, energyFee, estimatedFee });
  return estimatedFee;
}
