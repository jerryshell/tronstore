import { requireAdmin } from "../../utils/auth";
import { fetchTronGridTransactions, getTronGridConfig } from "../../utils/trongrid";

export default defineEventHandler(async (event): Promise<any> => {
  await requireAdmin(event);
  const query = getQuery(event);
  const address = query.address as string;
  const limit = parseInt(query.limit as string) || 20;
  const fingerprint = query.fingerprint as string;

  if (!address) {
    throw createError({ statusCode: 400, message: "地址参数缺失" });
  }

  const { network } = getTronGridConfig();

  try {
    const result = await fetchTronGridTransactions(address, limit, fingerprint);
    return {
      ...result,
      address,
      network,
    };
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message || "查询交易记录失败" });
  }
});
