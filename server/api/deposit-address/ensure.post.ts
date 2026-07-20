import { requireUser } from "../../utils/auth";
import { getUser } from "../../utils/storage";
import { ensureDepositAddressWithLock } from "../../utils/address";
import { logger } from "../../utils/logger";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);

  const user = await getUser(authUser.id);
  if (!user) {
    throw createError({ statusCode: 404, message: "用户不存在" });
  }

  if (user.depositAddress) {
    return { address: user.depositAddress };
  }

  try {
    const address = await ensureDepositAddressWithLock(authUser.id);
    return { address };
  } catch (error) {
    logger.error("分配地址失败", { userId: authUser.id, error: String(error) });
    throw createError({ statusCode: 500, message: "分配地址失败，请稍后重试" });
  }
});
