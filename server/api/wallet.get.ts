import { requireUser } from "../utils/auth";
import { getUser } from "../utils/storage";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  const user = await getUser(authUser.id);
  if (!user) throw createError({ statusCode: 404, message: "用户不存在" });

  return { balance: user.balance };
});
