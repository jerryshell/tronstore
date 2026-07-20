import { requireAdmin, csrfCheck } from "../../../utils/auth";
import { deleteProduct } from "../../../utils/storage";
import { logger } from "../../../utils/logger";

export default defineEventHandler(async (event) => {
  csrfCheck(event);
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少 id" });

  await deleteProduct(id);

  logger.info("商品删除成功", { productId: id });

  return { ok: true };
});
