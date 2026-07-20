import { serverConfig } from "../utils/runtime-config";
import { getTronechoNatsConnection, setTronechoPrefix, syncAllAddresses } from "../utils/tronecho";
import { startNatsSubscription } from "../utils/nats-sub";
import { cleanupExpiredSessions } from "../utils/storage";
import { logger } from "../utils/logger";

export default defineNitroPlugin(async () => {
  const config = serverConfig;

  setTronechoPrefix(config.tronechoPrefix);

  try {
    const conn = await getTronechoNatsConnection(config.tronechoNatsUrl);
    logger.info("Tronecho NATS已连接");

    // Sync all addresses on startup
    await syncAllAddresses();

    // Start JetStream consumer
    await startNatsSubscription(conn, config.tronechoPrefix);
    logger.info("Tronecho JetStream 消费者已启动");
  } catch (error) {
    logger.error("Tronecho NATS 连接失败", { error: String(error) });
  }

  // Session cleanup timer (every 30 minutes)
  setInterval(
    async () => {
      try {
        await cleanupExpiredSessions();
      } catch (error) {
        logger.error("会话清理失败", { error: String(error) });
      }
    },
    30 * 60 * 1000,
  );
});
