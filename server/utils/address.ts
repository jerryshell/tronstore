import { createMpcWallet } from "../services/mpc";
import { getUser, updateUser, updateUserAddress } from "./storage";
import { publicKeyToTronAddress } from "./tron-address";
import { registerAddress } from "./tronecho";
import { acquireUserLock } from "./user-lock";
import { logger } from "./logger";

/**
 * Ensure a user has a deposit address allocated.
 * Idempotent — if the user already has an address, returns immediately.
 * Must be called within the per-user lock.
 */
export async function ensureDepositAddress(userId: string): Promise<string> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");

  // Already has address — return immediately
  if (user.depositAddress) {
    return user.depositAddress;
  }

  // Keygen with MPC — let mpcium generate the walletId
  logger.info("开始MPC keygen", { userId });
  const result = await createMpcWallet();
  const mpcWalletId = result.mpcWalletId;

  // Derive address from public key
  const address = publicKeyToTronAddress(result.ecdsaPubKey);

  // Store wallet info
  const freshUser = await getUser(userId);
  if (freshUser) {
    freshUser.mpcWalletId = mpcWalletId;
    freshUser.ecdsaPubKey = result.ecdsaPubKey;
    freshUser.eddsaPubKey = result.eddsaPubKey;
    freshUser.updatedAt = Date.now();
    await updateUser(freshUser);
  }

  // Update address index (must be done via updateUserAddress)
  await updateUserAddress(userId, address);

  const registered = await registerAddress(address, user.email);
  if (!registered) {
    logger.warn("tronecho 地址注册失败，将稍后重试", { userId, address });
  }

  logger.info("充值地址分配完成", { userId, address, mpcWalletId });
  return address;
}

/**
 * Wrapper that acquires the per-user lock before ensuring address.
 */
export async function ensureDepositAddressWithLock(userId: string): Promise<string> {
  const release = await acquireUserLock(userId);
  try {
    return await ensureDepositAddress(userId);
  } finally {
    release();
  }
}
