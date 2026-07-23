import { logger } from "./logger";
import { serverConfig } from "./runtime-config";

interface TronGridConfig {
  baseUrl: string;
  apiKey: string;
  network: string;
}

export function getTronGridConfig(): TronGridConfig {
  const network = serverConfig.tronNetwork || "nile";
  const baseUrl = network === "mainnet" ? "https://api.trongrid.io" : "https://nile.trongrid.io";
  const apiKey = serverConfig.trongridApiKey || "";
  return { baseUrl, apiKey, network };
}

export function buildTronGridHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["TRON-PRO-API-KEY"] = apiKey;
  }
  return headers;
}

export async function fetchTronGridTransactions(
  address: string,
  limit: number,
  fingerprint?: string,
): Promise<{ transactions: any[]; fingerprint: string | null }> {
  const { baseUrl, apiKey } = getTronGridConfig();
  const headers = buildTronGridHeaders(apiKey);

  let url = `${baseUrl}/v1/accounts/${address}/transactions/trc20?limit=${limit}&order_by=block_timestamp,desc`;
  if (fingerprint) {
    url += `&fingerprint=${fingerprint}`;
  }

  try {
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
    };
  } catch (error: any) {
    logger.error("查询交易记录失败", { address, error: String(error) });
    throw error;
  }
}
