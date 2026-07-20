import { requireUser } from "../../utils/auth";
import { getOrder } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少 id" });

  const order = await getOrder(id);
  if (!order || order.userId !== authUser.id) {
    throw createError({ statusCode: 404, message: "订单不存在" });
  }

  return order;
});
