import { z } from "zod";
import { listProducts } from "../utils/storage";

const querySchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }

  const limit = parsed.data.limit ? parseInt(parsed.data.limit) : 50;
  const cursor = parsed.data.cursor;

  const result = await listProducts(limit, cursor);
  // Only return enabled products for non-admin
  return {
    items: result.items.filter((p) => p.enabled),
    cursor: result.cursor,
  };
});
