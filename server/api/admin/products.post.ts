import { z } from "zod";
import { v7 } from "uuid";
import { requireAdminCsrf, parseBody } from "../../utils/admin-query";
import { createProduct } from "../../utils/storage";
import { logger } from "../../utils/logger";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  price: z.number().int().min(0),
  enabled: z.boolean().default(true),
});

export default defineEventHandler(async (event) => {
  await requireAdminCsrf(event);

  const data = await parseBody(event, productSchema);

  const now = Date.now();
  const product = {
    id: v7(),
    name: data.name,
    description: data.description,
    price: data.price,
    enabled: data.enabled,
    createdAt: now,
    updatedAt: now,
  };

  await createProduct(product);

  logger.info("商品创建成功", { productId: product.id, name: product.name });

  return product;
});
