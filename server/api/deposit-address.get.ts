import { getCurrentUser } from "../utils/auth";
import { getEffectiveFeeRateBps } from "../utils/storage";

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  const effectiveFeeRateBps = await getEffectiveFeeRateBps(user);

  return {
    address: user.depositAddress,
    effectiveFeeRateBps,
  };
});
