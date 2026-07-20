import { requireAdmin } from "../../../utils/auth";
import { getUser, getSystemSettings } from "../../../utils/storage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少 id" });

  const user = await getUser(id);
  if (!user) throw createError({ statusCode: 404, message: "用户不存在" });

  const settings = await getSystemSettings();

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    balance: user.balance,
    depositAddress: user.depositAddress,
    mpcWalletId: user.mpcWalletId,
    feeRateBps: user.feeRateBps,
    effectiveFeeRateBps: user.feeRateBps ?? settings.defaultFeeRateBps,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
});
