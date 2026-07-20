import { getSweepSettings } from "../utils/storage";
import { runSweep, markInterruptedTasks } from "../services/sweep";
import { logger } from "../utils/logger";

export default defineNitroPlugin(async () => {
  // Mark any interrupted tasks on startup
  await markInterruptedTasks();

  // Sweep timer: check every minute
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
