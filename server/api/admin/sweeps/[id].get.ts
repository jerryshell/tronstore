import { requireAdmin } from "../../../utils/auth";
import { getSweepTask } from "../../../utils/storage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少 id" });

  const task = await getSweepTask(id);
  if (!task) throw createError({ statusCode: 404, message: "归集任务不存在" });

  return task;
});
