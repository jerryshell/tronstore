import { z } from "zod";
import { v7 } from "uuid";
import { createUser, getUserByEmail, countUsers } from "../../utils/storage";
import {
  hashPassword,
  validatePassword,
  validateEmail,
  createSessionCookie,
} from "../../utils/auth";
import { acquireRegistrationLock } from "../../utils/registration-lock";
import { logger } from "../../utils/logger";

const registerSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }

  const { email: rawEmail, password } = parsed.data;

  // Validate email
  const emailResult = validateEmail(rawEmail);
  if (!emailResult.valid) {
    throw createError({ statusCode: 400, message: emailResult.message });
  }
  const email = emailResult.normalized;

  // Validate password
  const pwResult = validatePassword(password);
  if (!pwResult.valid) {
    throw createError({ statusCode: 400, message: pwResult.message });
  }

  // Check if email already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    throw createError({ statusCode: 409, message: "邮箱已被注册" });
  }

  const release = await acquireRegistrationLock();
  try {
    // Determine role: first user = admin
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

    // Create session
    await createSessionCookie(event, userId);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      balance: user.balance,
      depositAddress: user.depositAddress,
      feeRateBps: user.feeRateBps,
    };
  } finally {
    release();
  }
});
