import { requireUser } from "../utils/auth";
import { parsePagination } from "../utils/admin-query";
import { listDepositsByUser } from "../utils/storage";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  return listDepositsByUser(authUser.id, limit, cursor);
});
