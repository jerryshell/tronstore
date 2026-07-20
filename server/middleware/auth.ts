import { getSessionUser } from "../utils/auth";

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  // Skip auth middleware for auth routes and static assets
  if (path.startsWith("/api/auth/") || path.startsWith("/_nuxt/") || path === "/favicon.ico") {
    return;
  }

  const user = await getSessionUser(event);
  if (user) {
    event.context.user = user;
  }
});
