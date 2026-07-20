import { z } from "zod";
import { requireAdmin, csrfCheck } from "../../../utils/auth";
import { getUser, updateUser } from "../../../utils/storage";
import { logger } from "../../../utils/logger";

const patchSchema = z.object({
  feeRateBps: z.number().int().min(0).max(10000).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  csrfCheck(event);
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少 id" });

  const body = await readBody(event);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }

  const user = await getUser(id);
  if (!user) throw createError({ statusCode: 404, message: "用户不存在" });

  if (parsed.data.feeRateBps !== undefined) {
    user.feeRateBps = parsed.data.feeRateBps;
  }

  user.updatedAt = Date.now();
  await updateUser(user);

  logger.info("管理员更新用户", { userId: id, updates: parsed.data });

  return { ok: true };
});
