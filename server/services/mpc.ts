import { MpciumClient, KeyType } from "@fystack/mpcium-ts";
import type { KeygenResultEvent, SigningResultEvent } from "@fystack/mpcium-ts";
import { connect } from "nats";
import { logger } from "../utils/logger";
import { serverConfig } from "../utils/runtime-config";

function getMpcConfig() {
  return {
    natsUrl: serverConfig.mpcNatsUrl,
    keyPath: serverConfig.mpcKeyPath,
    signTimeoutMs: 60_000,
  };
}

let nc: any = null;
let mpcClient: MpciumClient | null = null;

interface PendingResolver<T> {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pendingSignatures = new Map<
  string,
  PendingResolver<{ r: string; s: string; recovery: number }>
>();
const pendingKeygens = new Map<
  string,
  PendingResolver<{ mpcWalletId: string; ecdsaPubKey: string; eddsaPubKey: string }>
>();

function resolvePending<T>(
  map: Map<string, PendingResolver<T>>,
  key: string,
): PendingResolver<T> | null {
  const resolver = map.get(key);
  if (!resolver) return null;
  map.delete(key);
  clearTimeout(resolver.timer);
  return resolver;
}

function decodeSignatureResult(event: SigningResultEvent): {
  r: string;
  s: string;
  recovery: number;
} {
  return {
    r: Buffer.from(event.r!, "base64").toString("hex"),
    s: Buffer.from(event.s!, "base64").toString("hex"),
    recovery: event.signature_recovery
      ? (Buffer.from(event.signature_recovery, "base64")[0] ?? 0)
      : 0,
  };
}

function decodeKeygenResult(event: KeygenResultEvent): {
  mpcWalletId: string;
  ecdsaPubKey: string;
  eddsaPubKey: string;
} {
  return {
    mpcWalletId: event.wallet_id,
    ecdsaPubKey: event.ecdsa_pub_key!,
    eddsaPubKey: event.eddsa_pub_key!,
  };
}

export async function initMpcClient() {
  const { natsUrl, keyPath } = getMpcConfig();
  logger.info("初始化MPC客户端", { natsUrl });

  nc = await connect({ servers: natsUrl });
  logger.info("NATS已连接 (MPC)");

  mpcClient = await MpciumClient.create({
    nc,
    keyPath,
  });

  mpcClient.onSignResult((event: SigningResultEvent) => {
    const resolver = resolvePending(pendingSignatures, event.tx_id);
    if (!resolver) return;

    if (event.result_type !== "success" || !event.r || !event.s) {
      logger.error("签名失败", { txId: event.tx_id, error: event.error_message });
      resolver.reject(new Error(event.error_message || "签名失败"));
      return;
    }

    logger.info("签名成功", { txId: event.tx_id });
    resolver.resolve(decodeSignatureResult(event));
  });

  mpcClient.onWalletCreationResult((event: KeygenResultEvent) => {
    const resolver = resolvePending(pendingKeygens, event.wallet_id);
    if (!resolver) return;

    if (event.result_type !== "success" || !event.ecdsa_pub_key || !event.eddsa_pub_key) {
      logger.error("钱包创建失败", { walletId: event.wallet_id, error: event.error_reason });
      resolver.reject(new Error(event.error_reason || "钱包创建失败"));
      return;
    }

    logger.info("钱包创建成功", { walletId: event.wallet_id });
    resolver.resolve(decodeKeygenResult(event));
  });

  logger.info("MPC客户端初始化完成");
  return mpcClient;
}

function getMpcClient(): MpciumClient {
  if (!mpcClient) throw new Error("MPC client not initialized");
  return mpcClient;
}

export async function createMpcWallet(): Promise<{
  mpcWalletId: string;
  ecdsaPubKey: string;
  eddsaPubKey: string;
}> {
  const client = getMpcClient();
  const { signTimeoutMs } = getMpcConfig();

  logger.info("开始创建MPC钱包");

  // 不传 walletId，让 mpcium 自动生成
  // 手动传会导致 mpcium 返回错误的公钥
  const createdId = await client.createWallet();
  logger.info("钱包创建请求已发送", { walletId: createdId });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingKeygens.delete(createdId);
      reject(new Error(`钱包创建超时 (${signTimeoutMs}ms)`));
    }, signTimeoutMs);

    pendingKeygens.set(createdId, { resolve, reject, timer });
  });
}

export async function signWithMpc(
  walletId: string,
  txIdHex: string,
  networkInternalCode: string,
): Promise<{ r: string; s: string; recovery: number }> {
  const client = getMpcClient();
  const { signTimeoutMs } = getMpcConfig();

  logger.info("开始MPC签名", { walletId, txIdHex: txIdHex.slice(0, 20) + "..." });

  const txId = await client.signTransaction({
    walletId,
    keyType: KeyType.Secp256k1,
    networkInternalCode,
    tx: Buffer.from(txIdHex, "hex").toString("base64"),
  });

  logger.info("签名请求已发送", { txId });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingSignatures.delete(txId);
      reject(new Error(`签名超时 (${signTimeoutMs}ms)`));
    }, signTimeoutMs);

    pendingSignatures.set(txId, { resolve, reject, timer });
  });
}
