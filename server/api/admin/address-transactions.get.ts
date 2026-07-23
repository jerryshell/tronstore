import { logger } from "../../utils/logger";
import { serverConfig } from "../../utils/runtime-config";

export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event);
  const address = query.address as string;
  const limit = parseInt(query.limit as string) || 20;
  const fingerprint = query.fingerprint as string;

  if (!address) {
    throw createError({ statusCode: 400, message: "地址参数缺失" });
  }

  const network = serverConfig.tronNetwork || "nile";
  const baseUrl = network === "mainnet" ? "https://api.trongrid.io" : "https://nile.trongrid.io";
  const apiKey = serverConfig.trongridApiKey || "";

  try {
    // 获取TRC20交易记录
    let url = `${baseUrl}/v1/accounts/${address}/transactions/trc20?limit=${limit}&order_by=block_timestamp,desc`;
    if (fingerprint) {
      url += `&fingerprint=${fingerprint}`;
    }

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["TRON-PRO-API-KEY"] = apiKey;
    }

    const response: any = await $fetch<any>(url, { headers });

    const transactions: any[] = (response.data || []).map((tx: any) => ({
      txId: tx.transaction_id,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      tokenName: tx.token_info?.token_name || "USDT",
      tokenSymbol: tx.token_info?.token_symbol || "USDT",
      blockTimestamp: tx.block_timestamp,
      type: tx.type,
    }));

    return {
      transactions,
      fingerprint: response.meta?.fingerprint || null,
      address,
      network,
    };
  } catch (error: any) {
    logger.error("查询交易记录失败", { address, network, error: String(error) });
    throw createError({ statusCode: 500, message: error.message || "查询交易记录失败" });
  }
});
