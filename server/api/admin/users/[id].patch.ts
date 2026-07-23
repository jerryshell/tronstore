import { z } from "zod";
import { requireAdminCsrf, requireParam, parseBody } from "../../../utils/admin-query";
import { getUser, updateUser } from "../../../utils/storage";
import { logger } from "../../../utils/logger";

const patchSchema = z.object({
  feeRateBps: z.number().int().min(0).max(10000).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdminCsrf(event);
  const id = requireParam(event, "id");
  const data = await parseBody(event, patchSchema);

  const user = await getUser(id);
  if (!user) throw createError({ statusCode: 404, message: "用户不存在" });

  if (data.feeRateBps !== undefined) {
    user.feeRateBps = data.feeRateBps;
  }

  user.updatedAt = Date.now();
  await updateUser(user);

  logger.info("管理员更新用户", { userId: id, updates: data });

  return { ok: true };
});
