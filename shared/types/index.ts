export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  feeRateBps: number | null;
  mpcWalletId: string | null;
  ecdsaPubKey: string | null;
  eddsaPubKey: string | null;
  depositAddress: string | null;
  balance: number;
  createdAt: number;
  updatedAt: number;
}

export interface Deposit {
  id: string;
  userId: string;
  eventId: string;
  txHash: string;
  logIndex: number;
  asset: string;
  amountRaw: string;
  amount: number;
  feeRateBps: number;
  feeAmount: number;
  creditAmount: number;
  blockNumber: number;
  blockTime: number;
  from: string;
  to: string;
  createdAt: number;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  type: "deposit" | "purchase";
  amount: number;
  balanceAfter: number;
  refId: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productSnapshot: { name: string; description: string; price: number };
  price: number;
  createdAt: number;
}

export interface SweepItem {
  userId: string;
  address: string;
  amount: number;
  gasTxHash: string | null;
  txHash: string | null;
  status: "pending" | "gas_sent" | "done" | "failed" | "skipped";
  error: string | null;
}

export interface SweepTask {
  id: string;
  status: "running" | "done" | "failed" | "interrupted";
  targetAddress: string;
  threshold: number;
  totalAmount: number;
  items: SweepItem[];
  startedAt: number;
  finishedAt: number | null;
  error: string | null;
}

export interface SystemSettings {
  defaultFeeRateBps: number;
}

export interface SweepSettings {
  targetAddress: string;
  gasPoolPrivateKey: string | null;
  threshold: number;
  gasTrxAmount: number;
  intervalMinutes: number;
  enabled: boolean;
  lastRunAt: number | null;
}

export interface SessionData {
  userId: string;
  expiresAt: number;
  tokenHash: string;
}

export const USDT_CONTRACTS = {
  nile: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
  mainnet: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
} as const;
