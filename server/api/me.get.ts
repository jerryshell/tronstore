import { getCurrentUser, toPublicUser } from "../utils/auth";
import { getEffectiveFeeRateBps } from "../utils/storage";

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  const effectiveFeeRateBps = await getEffectiveFeeRateBps(user);

  return {
    ...toPublicUser(user),
    effectiveFeeRateBps,
    createdAt: user.createdAt,
  };
});
