import { getTrxBalance, getUsdtBalance, type TronNetwork } from "../../services/tron";
import { serverConfig } from "../../utils/runtime-config";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const address = query.address as string;

  if (!address) {
    throw createError({ statusCode: 400, message: "地址参数缺失" });
  }

  const network = serverConfig.tronNetwork as TronNetwork;

  try {
    const [trxBalance, usdtBalance] = await Promise.all([
      getTrxBalance(address, network),
      getUsdtBalance(address, network),
    ]);

    return {
      address,
      network,
      trx: trxBalance,
      usdt: usdtBalance,
    };
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message || "查询余额失败" });
  }
});
