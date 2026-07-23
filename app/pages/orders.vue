<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const { formatDate } = useTimezone();

const orders = ref<any[]>([]);
const cursor = ref<string | null>(null);
const loading = ref(true);
const showDetail = ref(false);
const detailOrder = ref<any>(null);

const columns = [
  { accessorKey: "productSnapshot.name", header: "商品" },
  {
    accessorKey: "price",
    header: "金额",
    cell: ({ row }: any) => (row.original.price / 1_000_000).toFixed(6) + " USDT",
  },
  {
    accessorKey: "createdAt",
    header: "时间",
    cell: ({ row }: any) => formatDate(row.original.createdAt),
  },
  { id: "actions", header: "操作" },
];

async function fetch() {
  loading.value = true;
  try {
    const data = await $fetch("/api/orders", { query: { limit: 50, cursor: cursor.value } });
    orders.value = (data as any).items || [];
    cursor.value = (data as any).cursor;
  } catch {}
  loading.value = false;
}

function viewDetail(order: any) {
  detailOrder.value = order;
  showDetail.value = true;
}

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="订单" />
    </template>

    <template #body>
      <div class="p-6">
        <UTable v-if="!loading && orders.length > 0" :data="orders" :columns="columns">
          <template #actions-cell="{ row }">
            <UButton size="xs" @click="viewDetail(row.original)">详情</UButton>
          </template>
        </UTable>

        <div v-else-if="loading" class="space-y-2">
          <USkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
        </div>
        <div v-else class="text-center text-muted-foreground py-12">暂无订单</div>
      </div>
    </template>
  </UDashboardPanel>

  <ModalsOrderDetailModal v-model:open="showDetail" :detail-order="detailOrder" />
</template>
