import { requireAdmin } from "../../utils/auth";
import { parsePagination } from "../../utils/query";
import { listAllOrders, getUser } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  const result = await listAllOrders(limit, cursor);

  // 为每个订单附加用户邮箱
  const items = await Promise.all(
    result.items.map(async (order: any) => {
      const user = await getUser(order.userId);
      return { ...order, userEmail: user?.email ?? "unknown" };
    }),
  );

  return { ...result, items };
});
