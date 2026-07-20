import { z } from "zod";
import { requireAdmin, csrfCheck } from "../../../utils/auth";
import { getProduct, updateProduct } from "../../../utils/storage";
import { logger } from "../../../utils/logger";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
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

  const product = await getProduct(id);
  if (!product) throw createError({ statusCode: 404, message: "商品不存在" });

  if (parsed.data.name !== undefined) product.name = parsed.data.name;
  if (parsed.data.description !== undefined) product.description = parsed.data.description;
  if (parsed.data.price !== undefined) product.price = parsed.data.price;
  if (parsed.data.enabled !== undefined) product.enabled = parsed.data.enabled;
  product.updatedAt = Date.now();

  await updateProduct(product);

  logger.info("商品更新成功", { productId: product.id });

  return product;
});
