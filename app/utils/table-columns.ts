export function useAmountColumn(header = "金额") {
  return {
    accessorKey: "amount",
    header,
    cell: ({ row }: any) => (row.original.amount / 1_000_000).toFixed(6),
  };
}

export function useDateColumn(accessorKey = "createdAt", header = "时间") {
  const { formatDate } = useTimezone();
  return {
    accessorKey,
    header,
    cell: ({ row }: any) => formatDate(row.original[accessorKey]),
  };
}

export function useBalanceColumn() {
  return {
    accessorKey: "balanceAfter",
    header: "余额",
    cell: ({ row }: any) => (row.original.balanceAfter / 1_000_000).toFixed(6),
  };
}

export function useCreditAmountColumn() {
  return {
    accessorKey: "creditAmount",
    header: "到账",
    cell: ({ row }: any) => (row.original.creditAmount / 1_000_000).toFixed(6),
  };
}

// ==============================
// Shared helpers (used by multiple list pages)
// ==============================

/** USDT amount column with " USDT" suffix. */
export function usdtColumn(accessorKey: string, header: string) {
  return {
    accessorKey,
    header,
    cell: ({ row }: any) => (row.original[accessorKey] / 1_000_000).toFixed(6) + " USDT",
  };
}

/** Convenience: dateColumn(formatDate) — thin wrapper around useDateColumn. */
export function dateColumn(fmt: (ts: number) => string) {
  return {
    accessorKey: "createdAt",
    header: "时间",
    cell: ({ row }: any) => fmt(row.original.createdAt),
  };
}

/** Amount + fee columns shared by deposit record pages. */
export function depositAmountColumns() {
  return [
    usdtColumn("amount", "金额"),
    {
      accessorKey: "feeRateBps",
      header: "手续费率",
      cell: ({ row }: any) => (row.original.feeRateBps / 100).toFixed(2) + "%",
    },
    usdtColumn("feeAmount", "手续费"),
    usdtColumn("creditAmount", "到账"),
  ];
}

export const actionsColumn = { id: "actions", header: "操作" };
