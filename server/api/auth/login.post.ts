import { z } from "zod";
import { getUserByEmail } from "../../utils/storage";
import {
  verifyPassword,
  createSessionCookie,
  requireValidEmail,
  toPublicUser,
} from "../../utils/auth";
import { parseBody } from "../../utils/query";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginRateLimit,
} from "../../utils/rate-limit";
import { logger } from "../../utils/logger";

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export default defineEventHandler(async (event) => {
  const { email: rawEmail, password } = await parseBody(event, loginSchema);
  const email = requireValidEmail(rawEmail);

  // 限流检查
  if (!checkLoginRateLimit(email)) {
    throw createError({ statusCode: 429, message: "登录尝试过多，请 5 分钟后再试" });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    recordLoginFailure(email);
    logger.warn("登录失败：用户不存在", { email });
    throw createError({ statusCode: 401, message: "邮箱或密码错误" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordLoginFailure(email);
    logger.warn("登录失败：密码错误", { email, userId: user.id });
    throw createError({ statusCode: 401, message: "邮箱或密码错误" });
  }

  resetLoginRateLimit(email);
  await createSessionCookie(event, user.id);

  logger.info("用户登录成功", { userId: user.id, email });

  return toPublicUser(user);
});
