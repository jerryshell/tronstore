import { z } from "zod";
import {
  requireUser,
  hashPassword,
  verifyPassword,
  requireValidPassword,
  createSessionCookie,
  destroySession,
  csrfCheck,
} from "../../utils/auth";
import { parseBody } from "../../utils/query";
import { getUser, updateUser, deleteUserSessions } from "../../utils/storage";
import { logger } from "../../utils/logger";

const passwordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
});

export default defineEventHandler(async (event) => {
  csrfCheck(event);

  const authUser = await requireUser(event);

  const { oldPassword, newPassword } = await parseBody(event, passwordSchema);

  // 校验新密码
  requireValidPassword(newPassword);

  const user = await getUser(authUser.id);
  if (!user) {
    throw createError({ statusCode: 404, message: "用户不存在" });
  }

  // 验证旧密码
  const valid = await verifyPassword(oldPassword, user.passwordHash);
  if (!valid) {
    throw createError({ statusCode: 400, message: "旧密码错误" });
  }

  // 更新密码
  user.passwordHash = await hashPassword(newPassword);
  user.updatedAt = Date.now();
  await updateUser(user);

  // 清除用户所有其他会话（保留当前）
  const currentToken = getCookie(event, "tronstore_session");
  // 删除该用户所有会话
  await deleteUserSessions(user.id);

  // 重新创建当前会话
  if (currentToken) {
    await destroySession(event);
  }
  await createSessionCookie(event, user.id);

  logger.info("密码修改成功", { userId: user.id });

  return { ok: true };
});
