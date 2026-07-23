import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import type { H3Event } from "h3";
import type { User } from "../../shared/types";
import { getSessionData, setSession, deleteSession, getUser } from "./storage";

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SESSION_TOKEN_BYTES = 32;
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_COOKIE = "tronstore_session";

// === Password hashing ===

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(SALT_LENGTH).toString("hex");
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    if (!salt || !key) return resolve(false);
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      const derivedHex = derivedKey.toString("hex");
      resolve(timingSafeEqual(Buffer.from(derivedHex), Buffer.from(key)));
    });
  });
}

// === Session management ===

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSessionCookie(event: H3Event, userId: string): Promise<void> {
  const token = randomBytes(SESSION_TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + SESSION_EXPIRY_MS;

  await setSession(tokenHash, { userId, expiresAt, tokenHash });

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: SESSION_EXPIRY_MS / 1000,
  });
}

export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE);
  if (token) {
    await deleteSession(hashToken(token));
  }
  deleteCookie(event, SESSION_COOKIE);
}

export async function getSessionUser(
  event: H3Event,
): Promise<{ id: string; email: string; role: "admin" | "user" } | null> {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await getSessionData(tokenHash);
  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    await deleteSession(tokenHash);
    return null;
  }

  // 滑动过期：活跃时自动续期
  const now = Date.now();
  if (session.expiresAt - now < SESSION_EXPIRY_MS / 2) {
    session.expiresAt = now + SESSION_EXPIRY_MS;
    await setSession(tokenHash, session);
    setCookie(event, SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: SESSION_EXPIRY_MS / 1000,
    });
  }

  const user = await getUser(session.userId);
  if (!user) return null;

  return { id: user.id, email: user.email, role: user.role };
}

// === Auth middleware helpers ===

export async function requireUser(
  event: H3Event,
): Promise<{ id: string; email: string; role: "admin" | "user" }> {
  const user = await getSessionUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "请先登录" });
  }
  return user;
}

export async function requireAdmin(
  event: H3Event,
): Promise<{ id: string; email: string; role: "admin" }> {
  const user = await requireUser(event);
  if (user.role !== "admin") {
    throw createError({ statusCode: 403, message: "需要管理员权限" });
  }
  return user as { id: string; email: string; role: "admin" };
}

/**
 * Require a session and load the full user record (404 if missing).
 */
export async function getCurrentUser(event: H3Event): Promise<User> {
  const authUser = await requireUser(event);
  const user = await getUser(authUser.id);
  if (!user) {
    throw createError({ statusCode: 404, message: "用户不存在" });
  }
  return user;
}

/**
 * Shape returned to clients after login/register.
 */
export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    balance: user.balance,
    depositAddress: user.depositAddress,
    feeRateBps: user.feeRateBps,
  };
}

// === CSRF check ===

function checkOriginHeader(headerName: string, event: H3Event, host: string): void {
  const value = getHeader(event, headerName);
  if (!value) return;
  try {
    if (new URL(value).host === host) return;
  } catch {
    // invalid URL, deny
  }
  throw createError({ statusCode: 403, message: "CSRF 校验失败" });
}

export function csrfCheck(event: H3Event): void {
  const host = getHeader(event, "host");
  if (!host) return; // native app / curl — pass through
  checkOriginHeader("origin", event, host);
  checkOriginHeader("referer", event, host);
}

// === Password validation ===

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: "密码至少 8 位" };
  }
  return { valid: true, message: "" };
}

export function validateEmail(email: string): {
  valid: boolean;
  message: string;
  normalized: string;
} {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !normalized.includes("@")) {
    return { valid: false, message: "邮箱格式不正确", normalized: "" };
  }
  return { valid: true, message: "", normalized };
}

/**
 * Validate and normalize an email, throwing 400 on failure.
 */
export function requireValidEmail(email: string): string {
  const result = validateEmail(email);
  if (!result.valid) {
    throw createError({ statusCode: 400, message: result.message });
  }
  return result.normalized;
}

/**
 * Validate password strength, throwing 400 on failure.
 */
export function requireValidPassword(password: string): void {
  const result = validatePassword(password);
  if (!result.valid) {
    throw createError({ statusCode: 400, message: result.message });
  }
}
