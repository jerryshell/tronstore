import { z } from "zod";
import {
  requireUser,
  hashPassword,
  verifyPassword,
  validatePassword,
  createSessionCookie,
  destroySession,
} from "../../utils/auth";
import { getUser, updateUser, deleteUserSessions } from "../../utils/storage";
import { csrfCheck } from "../../utils/auth";
import { logger } from "../../utils/logger";

const passwordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
});

export default defineEventHandler(async (event) => {
  csrfCheck(event);

  const authUser = await requireUser(event);

  const body = await readBody(event);
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }

  const { oldPassword, newPassword } = parsed.data;

  // Validate new password
  const pwResult = validatePassword(newPassword);
  if (!pwResult.valid) {
    throw createError({ statusCode: 400, message: pwResult.message });
  }

  const user = await getUser(authUser.id);
  if (!user) {
    throw createError({ statusCode: 404, message: "用户不存在" });
  }

  // Verify old password
  const valid = await verifyPassword(oldPassword, user.passwordHash);
  if (!valid) {
    throw createError({ statusCode: 400, message: "旧密码错误" });
  }

  // Update password
  user.passwordHash = await hashPassword(newPassword);
  user.updatedAt = Date.now();
  await updateUser(user);

  // Invalidate all other sessions (keep current one)
  const currentToken = getCookie(event, "tronstore_session");
  // Delete all sessions for this user
  await deleteUserSessions(user.id);

  // Re-create current session
  if (currentToken) {
    await destroySession(event);
  }
  await createSessionCookie(event, user.id);

  logger.info("密码修改成功", { userId: user.id });

  return { ok: true };
});
