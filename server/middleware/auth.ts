import { getSessionUser } from "../utils/auth";
import { logger } from "../utils/logger";

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  // 跳过认证路由和静态资源
  if (path.startsWith("/api/auth/") || path.startsWith("/_nuxt/") || path === "/favicon.ico") {
    return;
  }

  const user = await getSessionUser(event);
  if (user) {
    event.context.user = user;
    logger.debug("会话验证通过", { userId: user.id, path });
  } else if (path.startsWith("/api/")) {
    logger.debug("未登录请求", { path });
  }
});
