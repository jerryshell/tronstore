import { z } from "zod";
import { v7 } from "uuid";
import { requireAdmin, csrfCheck } from "../../utils/auth";
import { createProduct } from "../../utils/storage";
import { logger } from "../../utils/logger";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  price: z.number().int().min(0),
  enabled: z.boolean().default(true),
});

export default defineEventHandler(async (event) => {
  csrfCheck(event);
  await requireAdmin(event);

  const body = await readBody(event);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }

  const now = Date.now();
  const product = {
    id: v7(),
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    enabled: parsed.data.enabled,
    createdAt: now,
    updatedAt: now,
  };

  await createProduct(product);

  logger.info("商品创建成功", { productId: product.id, name: product.name });

  return product;
});
