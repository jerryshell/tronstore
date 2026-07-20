import { z } from "zod";
import { requireAdmin } from "./auth";

const paginationSchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

export function parsePagination(query: Record<string, unknown>) {
  const parsed = paginationSchema.safeParse(query);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }
  return {
    limit: parsed.data.limit ? parseInt(parsed.data.limit) : 50,
    cursor: parsed.data.cursor,
  };
}

export async function requireAdminWithId(event: any) {
  await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少 id" });
  return id;
}
