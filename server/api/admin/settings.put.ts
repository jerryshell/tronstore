import { z } from "zod";
import { requireAdminCsrf, parseBody } from "../../utils/query";
import { setSystemSettings } from "../../utils/storage";
import { applySweepSettings } from "../../services/sweep";
import { logger } from "../../utils/logger";

const settingsSchema = z.object({
  defaultFeeRateBps: z.number().int().min(0).max(10000).optional(),
  sweepTargetAddress: z.string().optional(),
  sweepGasPoolPrivateKey: z.string().optional(),
  sweepThreshold: z.number().int().min(0).optional(),
  sweepGasTrxAmount: z.number().int().min(0).optional(),
  sweepIntervalMinutes: z.number().int().min(1).optional(),
  sweepEnabled: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdminCsrf(event);
  const data = await parseBody(event, settingsSchema);

  if (data.defaultFeeRateBps !== undefined) {
    await setSystemSettings({ defaultFeeRateBps: data.defaultFeeRateBps });
  }

  await applySweepSettings(data);

  logger.info("设置已更新", { updates: Object.keys(data) });

  return { ok: true };
});
