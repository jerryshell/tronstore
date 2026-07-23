import { logger } from "./logger";

const userLocks = new Map<string, Promise<void>>();

// 获取用户级锁，序列化余额相关操作，返回 release 函数。硬超时 120 秒
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
