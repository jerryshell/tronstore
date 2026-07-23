import { destroySession } from "../../utils/auth";
import { logger } from "../../utils/logger";

export default defineEventHandler(async (event) => {
  await destroySession(event);
  logger.debug("用户已登出");
  return { ok: true };
});
