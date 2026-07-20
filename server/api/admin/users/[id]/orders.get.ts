import { requireAdminWithId, parsePagination } from "../../../../utils/admin-query";
import { listOrdersByUser } from "../../../../utils/storage";

export default defineEventHandler(async (event) => {
  const id = await requireAdminWithId(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  return await listOrdersByUser(id, limit, cursor);
});
