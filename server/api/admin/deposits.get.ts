import { requireAdmin } from "../../utils/auth";
import { parsePagination } from "../../utils/admin-query";
import { listAllDeposits } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  return await listAllDeposits(limit, cursor);
});
