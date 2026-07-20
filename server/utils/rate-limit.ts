import { logger } from "./logger";

interface RateLimitEntry {
  count: number;
  lockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Simple in-memory rate limiter for login.
 * Returns true if the request is allowed, false if locked.
 */
export function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry) return true;

  if (entry.lockedUntil > now) {
    return false;
  }

  if (entry.lockedUntil <= now && entry.count >= MAX_ATTEMPTS) {
    // lock expired, reset
    rateLimitMap.delete(email);
    return true;
  }

  return true;
}

export function recordLoginFailure(email: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(email) || { count: 0, lockedUntil: 0 };

  entry.count++;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION_MS;
    logger.warn("登录限流触发", { email, lockedUntil: new Date(entry.lockedUntil).toISOString() });
  }

  rateLimitMap.set(email, entry);
}

export function resetLoginRateLimit(email: string): void {
  rateLimitMap.delete(email);
}

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of rateLimitMap) {
    if (entry.lockedUntil <= now && entry.count >= MAX_ATTEMPTS) {
      rateLimitMap.delete(email);
    }
  }
}, 60_000);
