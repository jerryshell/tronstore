import { z } from "zod";
import { requireAdmin, csrfCheck } from "../../utils/auth";
import { setSystemSettings, setSweepSettings } from "../../utils/storage";
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
  csrfCheck(event);
  await requireAdmin(event);

  const body = await readBody(event);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }

  const data = parsed.data;

  // Update system settings
  if (data.defaultFeeRateBps !== undefined) {
    await setSystemSettings({ defaultFeeRateBps: data.defaultFeeRateBps });
  }

  // Update sweep settings
  if (
    data.sweepTargetAddress !== undefined ||
    data.sweepGasPoolPrivateKey !== undefined ||
    data.sweepThreshold !== undefined ||
    data.sweepGasTrxAmount !== undefined ||
    data.sweepIntervalMinutes !== undefined ||
    data.sweepEnabled !== undefined
  ) {
    const current = await import("../../utils/storage").then((m) => m.getSweepSettings());
    if (data.sweepTargetAddress !== undefined) current.targetAddress = data.sweepTargetAddress;
    if (data.sweepGasPoolPrivateKey !== undefined) {
      current.gasPoolPrivateKey = data.sweepGasPoolPrivateKey || null;
    }
    if (data.sweepThreshold !== undefined) current.threshold = data.sweepThreshold;
    if (data.sweepGasTrxAmount !== undefined) current.gasTrxAmount = data.sweepGasTrxAmount;
    if (data.sweepIntervalMinutes !== undefined)
      current.intervalMinutes = data.sweepIntervalMinutes;
    if (data.sweepEnabled !== undefined) current.enabled = data.sweepEnabled;
    await setSweepSettings(current);
  }

  logger.info("设置已更新", { updates: Object.keys(data) });

  return { ok: true };
});
