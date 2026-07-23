const { formatDate } = useTimezone();

export function useAmountColumn(header = "金额") {
  return {
    accessorKey: "amount",
    header,
    cell: ({ row }: any) => (row.original.amount / 1_000_000).toFixed(6),
  };
}

export function useDateColumn(accessorKey = "createdAt", header = "时间") {
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
