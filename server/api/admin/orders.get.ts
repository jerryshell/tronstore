import { requireAdmin } from "../../utils/auth";
import { parsePagination } from "../../utils/admin-query";
import { listAllOrders, getUser } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  const result = await listAllOrders(limit, cursor);

  // Attach user email to each order
  const items = await Promise.all(
    result.items.map(async (order: any) => {
      const user = await getUser(order.userId);
      return { ...order, userEmail: user?.email ?? "unknown" };
    }),
  );

  return { ...result, items };
});
