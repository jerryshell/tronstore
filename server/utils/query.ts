import { z } from "zod";
import type { H3Event } from "h3";
import { requireAdmin, csrfCheck } from "./auth";

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

// 读取 body 并用 zod schema 校验，不合法则抛 400
export async function parseBody<Schema extends z.ZodType>(
  event: H3Event,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }
  return parsed.data;
}

// CSRF 校验 + 管理员认证
export async function requireAdminCsrf(event: H3Event) {
  csrfCheck(event);
  return requireAdmin(event);
}

// 获取路由参数，缺失则抛 400
export function requireParam(event: H3Event, name: string): string {
  const value = getRouterParam(event, name);
  if (!value) throw createError({ statusCode: 400, message: `缺少 ${name}` });
  return value;
}
