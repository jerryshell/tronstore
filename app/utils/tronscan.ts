/**
 * Tron network helpers.
 */

export function useTronNetwork(): string {
  const config = useRuntimeConfig();
  return config.public.tronNetwork as string;
}

/** Build a TronScan address page URL for the current network. */
export function tronscanAddressUrl(address: string): string {
  const base =
    useTronNetwork() === "mainnet" ? "https://tronscan.org" : "https://nile.tronscan.org";
  return `${base}/#/address/${address}`;
}

/** Build a TronScan transaction page URL for the current network. */
export function tronscanTxUrl(txId: string): string {
  const net = useTronNetwork();
  const host = net === "mainnet" ? "tronscan.org" : "nile.tronscan.org";
  return `https://${host}/#/transaction/${txId}`;
}
