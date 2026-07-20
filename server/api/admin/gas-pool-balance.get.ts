import { requireAdmin } from "../../utils/auth";
import { getSweepSettings } from "../../utils/storage";
import { getTrxBalance, getUsdtBalance } from "../../services/tron";
import { logger } from "../../utils/logger";
import { useRuntimeConfig } from "#imports";
import { TronWeb } from "tronweb";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const sweepSettings = await getSweepSettings();
  const privKey = sweepSettings.gasPoolPrivateKey;

  if (!privKey) {
    throw createError({ statusCode: 400, message: "未设置 Gas 池私钥" });
  }

  const config = useRuntimeConfig();
  const network = (config.public as any).tronNetwork || "nile";
  const fullHost = network === "mainnet" ? "https://api.trongrid.io" : "https://nile.trongrid.io";

  try {
    const tronWeb = new TronWeb({ fullHost, privateKey: privKey });
    const address = (tronWeb.defaultAddress as any).base58 as string;

    const [trxInfo, usdtInfo] = await Promise.all([
      getTrxBalance(address, network),
      getUsdtBalance(address, network),
    ]);

    return {
      address,
      trxBalance: Number(trxInfo.sun),
      usdtBalance: Number(usdtInfo.raw),
    };
  } catch (error: any) {
    logger.error("检查 Gas 池余量失败:", error);
    throw createError({ statusCode: 500, message: error.message || "查询失败" });
  }
});
