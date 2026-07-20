import { requireAdmin, csrfCheck } from "../../../utils/auth";
import { runSweep } from "../../../services/sweep";
import { logger } from "../../../utils/logger";

export default defineEventHandler(async (event) => {
  csrfCheck(event);
  await requireAdmin(event);

  logger.info("管理员手动触发归集");

  const task = await runSweep();

  return {
    ok: true,
    message: task ? "归集任务已触发" : "归集正在运行中",
    task,
  };
});
