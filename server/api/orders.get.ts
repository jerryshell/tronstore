import { requireUser } from "../utils/auth";
import { parsePagination } from "../utils/admin-query";
import { listOrdersByUser } from "../utils/storage";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  return listOrdersByUser(authUser.id, limit, cursor);
});
