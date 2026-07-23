import { type NatsConnection, type JetStreamClient, JSONCodec, AckPolicy } from "nats";
import {
  getUserByAddress,
  createDeposit,
  createLedgerEntry,
  updateUserBalance,
  getDepositByEventId,
  isUsdtAsset,
  getSystemSettings,
} from "./storage";
import { acquireUserLock } from "./user-lock";
import { logger } from "./logger";
import { serverConfig } from "./runtime-config";
import { v7 } from "uuid";

interface TronechoTransfer {
  v: number;
  id: string;
  chain: string;
  blockNumber: number;
  blockHash: string;
  txHash: string;
  logIndex: number;
  from: string;
  to: string;
  asset: string;
  symbol: string;
  decimals: number;
  amount: string;
  fee: string;
  blockTime: number;
  direction: string;
  label?: string;
}

const jc = JSONCodec();

let js: JetStreamClient | null = null;
let nc: NatsConnection | null = null;
let running = false;

export async function startNatsSubscription(conn: NatsConnection, prefix: string) {
  if (running) {
    logger.warn("NATS 订阅已在运行");
    return;
  }

  nc = conn;
  js = conn.jetstream();
  running = true;

  logger.info("开始消费 JetStream 事件");
  consumeEvents(prefix);
}

async function processMessage(msg: any): Promise<void> {
  try {
    const event = jc.decode(msg.data) as TronechoTransfer;
    await processTransferEvent(event);
    msg.ack();
  } catch (error) {
    logger.error("处理事件失败", { error: String(error) });
    msg.nak();
  }
}

async function consumeEvents(prefix: string) {
  if (!js || !nc || !running) return;

  try {
    let consumer;
    try {
      consumer = await js.consumers.get(prefix, `${prefix}-tronstore`);
    } catch {
      const jsm = await nc.jetstreamManager();
      await jsm.consumers.add(prefix, {
        durable_name: `${prefix}-tronstore`,
        ack_policy: AckPolicy.Explicit,
      });
      consumer = await js.consumers.get(prefix, `${prefix}-tronstore`);
    }
    logger.info("JetStream 消费者就绪", { stream: prefix });

    const messages = await consumer.consume({
      max_messages: 100,
      expires: 5000,
    });

    for await (const msg of messages) {
      if (!running) break;
      await processMessage(msg);
    }
  } catch (error) {
    logger.error("JetStream 消费错误", { error: String(error) });
    if (running) {
      setTimeout(() => consumeEvents(prefix), 5000);
    }
  }

  // 立即继续拉取下一批
  if (running) {
    consumeEvents(prefix);
  }
}

function isValidTransfer(event: TronechoTransfer): boolean {
  const network = serverConfig.tronNetwork;
  return isUsdtAsset(event.asset, network) && event.direction === "in";
}

async function processTransferEvent(event: TronechoTransfer) {
  logger.debug("收到事件", {
    id: event.id,
    asset: event.asset,
    direction: event.direction,
    to: event.to,
  });

  if (!isValidTransfer(event)) return;

  // 去重检查
  const existing = await getDepositByEventId(event.id);
  if (existing) {
    logger.warn("重复事件，跳过", { eventId: event.id });
    return;
  }

  const user = await getUserByAddress(event.to);
  if (!user) {
    logger.warn("未找到用户，跳过充值", { address: event.to });
    return;
  }

  // 获取用户锁
  const release = await acquireUserLock(user.id);
  try {
    // 锁获取后重新读取用户，确保余额一致性
    const { getUser } = await import("./storage");
    const freshUser = await getUser(user.id);
    if (!freshUser) return;

    const amount = Number(event.amount);
    if (!Number.isSafeInteger(amount)) {
      logger.error("充值金额不安全", { eventId: event.id, amount: event.amount });
      return;
    }

    // 确定费率：用户自定义或系统默认
    const settings = await getSystemSettings();
    const feeRateBps = freshUser.feeRateBps ?? settings.defaultFeeRateBps;
    const feeAmount = Math.floor((amount * feeRateBps) / 10000);
    const creditAmount = amount - feeAmount;

    logger.info("处理充值", {
      userId: freshUser.id,
      amount,
      feeRateBps,
      feeAmount,
      creditAmount,
    });

    const depositId = v7();
    const now = Date.now();

    // 创建充值记录
    await createDeposit({
      id: depositId,
      userId: freshUser.id,
      eventId: event.id,
      txHash: event.txHash,
      logIndex: event.logIndex,
      asset: event.asset,
      amountRaw: event.amount,
      amount,
      feeRateBps,
      feeAmount,
      creditAmount,
      blockNumber: event.blockNumber,
      blockTime: event.blockTime,
      from: event.from,
      to: event.to,
      createdAt: now,
    });

    // 更新余额
    const updatedUser = await updateUserBalance(freshUser.id, creditAmount);

    // 创建流水
    await createLedgerEntry({
      id: v7(),
      userId: freshUser.id,
      type: "deposit",
      amount: creditAmount,
      balanceAfter: updatedUser.balance,
      refId: depositId,
      createdAt: now,
    });

    logger.info("充值完成", {
      userId: freshUser.id,
      creditAmount,
      newBalance: updatedUser.balance,
    });
  } finally {
    release();
  }
}

export async function stopNatsSubscription() {
  running = false;
}
