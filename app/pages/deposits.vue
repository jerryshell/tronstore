<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const { formatDate } = useTimezone();

const items = ref<any[]>([]);
const cursor = ref<string | null>(null);
const loading = ref(true);
const showDetail = ref(false);
const detailItem = ref<any>(null);

async function fetch() {
  loading.value = true;
  try {
    const data = await $fetch("/api/deposits", { query: { limit: 50, cursor: cursor.value } });
    items.value = (data as any).items || [];
    cursor.value = (data as any).cursor;
  } finally {
    loading.value = false;
  }
}

function viewDetail(item: any) {
  detailItem.value = item;
  showDetail.value = true;
}

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="充值记录" />
    </template>

    <template #body>
      <div class="p-6">
        <UTable
          v-if="!loading && items.length > 0"
          :data="items"
          :columns="[
            {
              accessorKey: 'amount',
              header: '金额',
              cell: ({ row }: any) => (row.original.amount / 1_000_000).toFixed(6) + ' USDT',
            },
            {
              accessorKey: 'feeRateBps',
              header: '手续费率',
              cell: ({ row }: any) => (row.original.feeRateBps / 100).toFixed(2) + '%',
            },
            {
              accessorKey: 'feeAmount',
              header: '手续费',
              cell: ({ row }: any) => (row.original.feeAmount / 1_000_000).toFixed(6) + ' USDT',
            },
            {
              accessorKey: 'creditAmount',
              header: '到账',
              cell: ({ row }: any) => (row.original.creditAmount / 1_000_000).toFixed(6) + ' USDT',
            },
            {
              accessorKey: 'createdAt',
              header: '时间',
              cell: ({ row }: any) => formatDate(row.original.createdAt),
            },
            { id: 'actions', header: '操作' },
          ]"
        >
          <template #actions-cell="{ row }">
            <UButton size="xs" @click="viewDetail(row.original)">详情</UButton>
          </template>
        </UTable>

        <div v-else-if="loading" class="space-y-2">
          <USkeleton v-for="i in 8" :key="i" class="h-10 w-full" />
        </div>
        <div v-else class="text-center text-muted-foreground py-12">暂无充值记录</div>
      </div>
    </template>
  </UDashboardPanel>

  <ModalsDepositDetailModal v-model:open="showDetail" :detail-item="detailItem" />
</template>
