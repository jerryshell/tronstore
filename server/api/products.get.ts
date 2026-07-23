import { parsePagination } from "../utils/admin-query";
import { listProducts } from "../utils/storage";

export default defineEventHandler(async (event) => {
  const { limit, cursor } = parsePagination(getQuery(event));
  const result = await listProducts(limit, cursor);
  // 仅返回已启用的商品
  return {
    items: result.items.filter((p) => p.enabled),
    cursor: result.cursor,
  };
});
