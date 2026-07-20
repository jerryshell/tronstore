import { requireAdmin } from "../../utils/auth";
import { listUsers } from "../../utils/storage";
import { getSystemSettings } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const users = await listUsers();
  const settings = await getSystemSettings();

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    balance: u.balance,
    depositAddress: u.depositAddress,
    feeRateBps: u.feeRateBps,
    effectiveFeeRateBps: u.feeRateBps ?? settings.defaultFeeRateBps,
    createdAt: u.createdAt,
  }));
});
