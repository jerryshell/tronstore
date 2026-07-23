import { getSweepSettings } from "../utils/storage";
import { runSweep, markInterruptedTasks } from "../services/sweep";
import { logger } from "../utils/logger";

export default defineNitroPlugin(async () => {
  // 标记启动前中断的归集任务
  await markInterruptedTasks();

  // 每分钟检查一次归集
  setInterval(async () => {
    try {
      const settings = await getSweepSettings();
      if (!settings.enabled) return;

      const now = Date.now();
      const intervalMs = (settings.intervalMinutes || 60) * 60 * 1000;

      if (settings.lastRunAt && now - settings.lastRunAt < intervalMs) {
        return;
      }

      logger.info("定时触发归集");
      await runSweep();
    } catch (error) {
      logger.error("定时归集失败", { error: String(error) });
    }
  }, 60_000);
});
