import { requireAdminWithId, parsePagination } from "../../../../utils/admin-query";
import { listLedgerByUser } from "../../../../utils/storage";

export default defineEventHandler(async (event) => {
  const id = await requireAdminWithId(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  return await listLedgerByUser(id, limit, cursor);
});
