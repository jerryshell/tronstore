import { z } from "zod";
import { requireAdminCsrf, requireParam, parseBody } from "../../../utils/admin-query";
import { getProduct, updateProduct } from "../../../utils/storage";
import { logger } from "../../../utils/logger";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdminCsrf(event);
  const id = requireParam(event, "id");
  const data = await parseBody(event, patchSchema);

  const product = await getProduct(id);
  if (!product) throw createError({ statusCode: 404, message: "商品不存在" });

  const updates = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  Object.assign(product, updates);
  product.updatedAt = Date.now();

  await updateProduct(product);

  logger.info("商品更新成功", { productId: product.id });

  return product;
});
