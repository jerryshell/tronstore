import { logger } from "./logger";

// 全局注册锁：确保"首个用户=管理员"判断原子化
// 仅包裹用户创建 + 角色判定，不阻塞异步地址分配

let registrationLock: Promise<void> | null = null;

export async function acquireRegistrationLock(): Promise<() => void> {
  while (registrationLock) {
    await registrationLock;
  }

  logger.debug("注册锁已获取");

  let release: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    release = resolve;
  });

  registrationLock = lockPromise;

  return () => {
    registrationLock = null;
    release!();
    logger.debug("注册锁已释放");
  };
}
