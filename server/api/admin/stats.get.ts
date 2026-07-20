import { requireAdmin } from "../../utils/auth";
import { countUsers, countDeposits, countOrders, listUsers } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const [userCount, depositCount, orderCount] = await Promise.all([
    countUsers(),
    countDeposits(),
    countOrders(),
  ]);
  const users = await listUsers();
  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);

  return {
    userCount,
    depositCount,
    orderCount,
    totalBalance,
  };
});
