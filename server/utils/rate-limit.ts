import { logger } from "./logger";

interface RateLimitEntry {
  count: number;
  lockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 分钟

// 简易内存限流器，用于登录接口
export function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry) return true;

  if (entry.lockedUntil > now) {
    logger.debug("登录限流拦截", { email, remainingMs: entry.lockedUntil - now });
    return false;
  }

  if (entry.lockedUntil <= now && entry.count >= MAX_ATTEMPTS) {
    // lock expired, reset
    rateLimitMap.delete(email);
  }

  return true;
}

export function recordLoginFailure(email: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(email) || { count: 0, lockedUntil: 0 };

  entry.count++;
  logger.debug("登录失败记录", { email, attempt: entry.count });

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION_MS;
    logger.warn("登录限流触发", { email, lockedUntil: new Date(entry.lockedUntil).toISOString() });
  }

  rateLimitMap.set(email, entry);
}

export function resetLoginRateLimit(email: string): void {
  rateLimitMap.delete(email);
  logger.debug("登录限流已重置", { email });
}

// 定期清理过期条目
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of rateLimitMap) {
    if (entry.lockedUntil <= now && entry.count >= MAX_ATTEMPTS) {
      rateLimitMap.delete(email);
    }
  }
}, 60_000);
