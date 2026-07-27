const USDT_DIVISOR = 1_000_000;

/** Format a micro-USDT integer as "1.234567" */
export function formatUsdt(micro: number): string {
  return (micro / USDT_DIVISOR).toFixed(6);
}

/** Format a micro-USDT integer as "1.234567 USDT" */
export function formatUsdtLabel(micro: number): string {
  return formatUsdt(micro) + " USDT";
}

/** Parse a user-facing USDT decimal to micro-USDT integer */
export function parseUsdt(usdt: number): number {
  return Math.round(usdt * USDT_DIVISOR);
}

/** Convert micro-USDT integer to user-facing decimal number */
export function toUsdt(micro: number): number {
  return micro / USDT_DIVISOR;
}
