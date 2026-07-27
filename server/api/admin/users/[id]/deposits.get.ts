import { requireAdminWithId, parsePagination } from "../../../../utils/query";
import { listDepositsByUser } from "../../../../utils/storage";

export default defineEventHandler(async (event) => {
  const id = await requireAdminWithId(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  return await listDepositsByUser(id, limit, cursor);
});
