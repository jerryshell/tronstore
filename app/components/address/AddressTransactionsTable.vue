<template>
  <div class="mt-4">
    <div v-if="loading && transactions.length === 0" class="space-y-2">
      <USkeleton v-for="i in 5" :key="i" class="h-12 w-full" />
    </div>
    <div v-else-if="transactions.length > 0" class="space-y-4">
      <UTable :data="transactions" :columns="columns">
        <template #actions-cell="{ row }">
          <UButton
            size="xs"
            variant="outline"
            icon="i-lucide-external-link"
            :to="`https://${network === 'mainnet' ? '' : 'nile.'}tronscan.org/#/transaction/${row.original.txId}`"
            target="_blank"
          >
            查看
          </UButton>
        </template>
      </UTable>

      <div v-if="hasMore" class="text-center">
        <UButton variant="outline" :loading="loading" @click="$emit('loadMore')">
          加载更多
        </UButton>
      </div>
    </div>
    <div v-else class="text-center py-8 text-muted-foreground">暂无交易记录</div>
  </div>
</template>

<script setup lang="ts">
const { formatDate } = useTimezone();
const config = useRuntimeConfig();
const network = config.public.tronNetwork as string;

const props = defineProps<{
  loading: boolean;
  transactions: any[];
  address: string;
  hasMore: boolean;
}>();

defineEmits<{
  loadMore: [];
}>();

function formatValue(value: string, decimals = 6) {
  const num = parseFloat(value) / Math.pow(10, decimals);
  return num.toFixed(decimals);
}

function formatTime(timestamp: number) {
  return formatDate(new Date(timestamp));
}

const columns = [
  {
    accessorKey: "type",
    header: "类型",
    cell: ({ row }: any) => {
      const isReceive = row.original.to?.toLowerCase() === props.address?.toLowerCase();
      return isReceive ? "接收" : "发送";
    },
  },
  {
    accessorKey: "amount",
    header: "金额",
    cell: ({ row }: any) => formatValue(row.original.value) + " USDT",
  },
  {
    accessorKey: "from",
    header: "发送方",
    cell: ({ row }: any) => row.original.from || "-",
  },
  {
    accessorKey: "to",
    header: "接收方",
    cell: ({ row }: any) => row.original.to || "-",
  },
  {
    accessorKey: "blockTimestamp",
    header: "时间",
    cell: ({ row }: any) => formatTime(row.original.blockTimestamp),
  },
  { id: "actions", header: "操作" },
];
</script>
