import { requireAdmin } from "../../utils/auth";
import { parsePagination } from "../../utils/query";
import { listAllDeposits, getUser } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  const result = await listAllDeposits(limit, cursor);

  // 获取用户邮箱
  const items = await Promise.all(
    result.items.map(async (deposit) => {
      const user = await getUser(deposit.userId);
      return {
        ...deposit,
        userEmail: user?.email || "未知",
      };
    }),
  );

  return {
    items,
    cursor: result.cursor,
  };
});
