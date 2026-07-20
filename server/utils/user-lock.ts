import { logger } from "./logger";

const userLocks = new Map<string, Promise<void>>();

/**
 * Acquire a per-user lock to serialize balance-critical operations.
 * Returns a release function. Hard timeout 120s - if the lock chain
 * stalls, we force-release and log an error.
 */
export async function acquireUserLock(userId: string): Promise<() => void> {
  let waited = false;

  while (userLocks.has(userId)) {
    if (!waited) {
      logger.info("等待用户锁", { userId });
      waited = true;
    }
    await userLocks.get(userId);
  }

  if (waited) {
    logger.info("用户锁已获取", { userId });
  }

  let release: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    release = resolve;
  });

  userLocks.set(userId, lockPromise);

  const timeout = setTimeout(() => {
    logger.error("用户锁超时强制释放", { userId });
    userLocks.delete(userId);
    release!();
  }, 120_000);

  return () => {
    clearTimeout(timeout);
    userLocks.delete(userId);
    release!();
  };
}
