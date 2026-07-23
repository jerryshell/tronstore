import { createMpcWallet } from "../services/mpc";
import { getUser, updateUser, updateUserAddress } from "./storage";
import { publicKeyToTronAddress } from "./tron-address";
import { registerAddress } from "./tronecho";
import { acquireUserLock } from "./user-lock";
import { logger } from "./logger";

// 确保用户已分配充值地址，幂等操作（已有地址则立即返回）
export async function ensureDepositAddress(userId: string): Promise<string> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");

  // 已有地址，直接返回
  if (user.depositAddress) {
    return user.depositAddress;
  }

  // MPC 密钥生成，让 mpcium 自动生成 walletId
  logger.info("开始MPC keygen", { userId });
  const result = await createMpcWallet();
  const mpcWalletId = result.mpcWalletId;

  // 从公钥推导 Tron 地址
  const address = publicKeyToTronAddress(result.ecdsaPubKey);

  // 存储钱包信息
  const freshUser = await getUser(userId);
  if (freshUser) {
    freshUser.mpcWalletId = mpcWalletId;
    freshUser.ecdsaPubKey = result.ecdsaPubKey;
    freshUser.eddsaPubKey = result.eddsaPubKey;
    freshUser.updatedAt = Date.now();
    await updateUser(freshUser);
  }

  // 更新地址索引
  await updateUserAddress(userId, address);

  const registered = await registerAddress(address, user.email);
  if (!registered) {
    logger.warn("tronecho 地址注册失败，将稍后重试", { userId, address });
  }

  logger.info("充值地址分配完成", { userId, address, mpcWalletId });
  return address;
}

// 获取用户锁后分配地址的包装
export async function ensureDepositAddressWithLock(userId: string): Promise<string> {
  const release = await acquireUserLock(userId);
  try {
    return await ensureDepositAddress(userId);
  } finally {
    release();
  }
}
