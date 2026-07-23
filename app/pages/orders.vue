<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const { formatDate } = useTimezone();

const { items: orders, loading, fetch } = useCursorPagination("/api/orders");
const { open: showDetail, item: detailOrder, show: viewDetail } = useDetailModal();

const columns = [
  { accessorKey: "productSnapshot.name", header: "商品" },
  usdtColumn("price", "金额"),
  dateColumn(formatDate),
  actionsColumn,
];

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="订单" />
    </template>

    <template #body>
      <div class="p-6">
        <DataTable
          :data="orders"
          :columns="columns"
          :loading="loading"
          empty-message="暂无订单"
          @view="viewDetail"
        />
      </div>
    </template>
  </UDashboardPanel>

  <ModalsOrderDetailModal v-model:open="showDetail" :detail-order="detailOrder" />
</template>
