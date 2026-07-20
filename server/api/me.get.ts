import { requireUser } from "../utils/auth";
import { getUser, getSystemSettings } from "../utils/storage";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  const user = await getUser(authUser.id);
  if (!user) {
    throw createError({ statusCode: 404, message: "用户不存在" });
  }

  const settings = await getSystemSettings();
  const effectiveFeeRateBps = user.feeRateBps ?? settings.defaultFeeRateBps;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    balance: user.balance,
    depositAddress: user.depositAddress,
    feeRateBps: user.feeRateBps,
    effectiveFeeRateBps,
    createdAt: user.createdAt,
  };
});
