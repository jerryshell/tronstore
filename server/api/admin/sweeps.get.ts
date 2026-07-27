import { requireAdmin } from "../../utils/auth";
import { parsePagination } from "../../utils/query";
import { listSweepTasks } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { limit, cursor } = parsePagination(getQuery(event));
  return await listSweepTasks(limit, cursor);
});
