import { z } from "zod";
import { requireUser } from "../../utils/auth";
import { listLedgerByUser } from "../../utils/storage";

const querySchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  const query = getQuery(event);
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }

  const limit = parsed.data.limit ? parseInt(parsed.data.limit) : 50;
  const cursor = parsed.data.cursor;

  const result = await listLedgerByUser(authUser.id, limit, cursor);
  return result;
});
