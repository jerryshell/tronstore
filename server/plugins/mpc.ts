import { initMpcClient } from "../services/mpc";
import { logger } from "../utils/logger";

export default defineNitroPlugin(async () => {
  try {
    await initMpcClient();
    logger.info("MPC客户端已就绪");
  } catch (error) {
    logger.warn("MPC客户端初始化失败", { error: String(error) });
  }
});
