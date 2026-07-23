import { z } from "zod";
import { v7 } from "uuid";
import { createUser, getUserByEmail, countUsers } from "../../utils/storage";
import {
  hashPassword,
  requireValidPassword,
  requireValidEmail,
  createSessionCookie,
  toPublicUser,
} from "../../utils/auth";
import { parseBody } from "../../utils/admin-query";
import { acquireRegistrationLock } from "../../utils/registration-lock";
import { logger } from "../../utils/logger";

const registerSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export default defineEventHandler(async (event) => {
  const { email: rawEmail, password } = await parseBody(event, registerSchema);
  const email = requireValidEmail(rawEmail);
  requireValidPassword(password);

  // 检查邮箱是否已被注册
  const existing = await getUserByEmail(email);
  if (existing) {
    throw createError({ statusCode: 409, message: "邮箱已被注册" });
  }

  const release = await acquireRegistrationLock();
  try {
    // 判断角色：首个用户为管理员
    const userCount = await countUsers();
    const role: "admin" | "user" = userCount === 0 ? "admin" : "user";

    const passwordHash = await hashPassword(password);
    const now = Date.now();
    const userId = v7();

    const user = {
      id: userId,
      email,
      passwordHash,
      role,
      feeRateBps: null,
      mpcWalletId: null,
      ecdsaPubKey: null,
      eddsaPubKey: null,
      depositAddress: null,
      balance: 0,
      createdAt: now,
      updatedAt: now,
    };

    await createUser(user);

    logger.info("用户注册成功", { userId, email, role });

    // 创建会话
    await createSessionCookie(event, userId);

    return toPublicUser(user);
  } finally {
    release();
  }
});
