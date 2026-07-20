import { requireUser } from "../../utils/auth";
import { getDeposit } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少 id" });

  const deposit = await getDeposit(id);
  if (!deposit || deposit.userId !== authUser.id) {
    throw createError({ statusCode: 404, message: "充值记录不存在" });
  }

  return deposit;
});
