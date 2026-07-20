import { z } from "zod";
import { requireAdmin } from "../../utils/auth";
import { listAllOrders, getUser } from "../../utils/storage";

const querySchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const query = getQuery(event);
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }

  const limit = parsed.data.limit ? parseInt(parsed.data.limit) : 50;
  const cursor = parsed.data.cursor;

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
