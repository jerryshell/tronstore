import { requireAdmin } from "../../utils/auth";
import { getSystemSettings, getSweepSettings } from "../../utils/storage";
import { serverConfig } from "../../utils/runtime-config";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const system = await getSystemSettings();
  const sweep = await getSweepSettings();

  return {
    system,
    sweep: {
      targetAddress: sweep.targetAddress,
      hasGasPoolKey: !!(sweep.gasPoolPrivateKey || serverConfig.gasPoolPrivateKey),
      threshold: sweep.threshold,
      gasTrxAmount: sweep.gasTrxAmount,
      intervalMinutes: sweep.intervalMinutes,
      enabled: sweep.enabled,
      lastRunAt: sweep.lastRunAt,
    },
  };
});
