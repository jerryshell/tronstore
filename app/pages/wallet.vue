<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const { formatDate } = useTimezone();

const balance = ref(0);
const { items: entries, loading, fetch: fetchLedger } = useCursorPagination("/api/wallet/ledger");
const { open: showDetail, item: detailItem, show } = useDetailModal();
const detailData = ref<any>(null);
const loadingDetail = ref(false);

const columns = [
  {
    accessorKey: "type",
    header: "类型",
    cell: ({ row }: any) => (row.original.type === "deposit" ? "充值" : "购买"),
  },
  usdtColumn("amount", "金额"),
  {
    accessorKey: "balanceAfter",
    header: "余额",
    cell: ({ row }: any) => (row.original.balanceAfter / 1_000_000).toFixed(6),
  },
  dateColumn(formatDate),
  actionsColumn,
];

async function fetch() {
  loading.value = true;
  try {
    const bal = await $fetch("/api/wallet");
    balance.value = (bal as any).balance;
  } catch {}
  await fetchLedger();
}

async function viewDetail(entry: any) {
  show(entry);
  detailData.value = null;
  loadingDetail.value = true;
  try {
    if (entry.type === "deposit") {
      detailData.value = await $fetch(`/api/deposits/${entry.refId}`);
    } else {
      detailData.value = await $fetch(`/api/orders/${entry.refId}`);
    }
  } catch {}
  loadingDetail.value = false;
}

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="我的钱包" />
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">余额</h2>
          </template>
          <div v-if="loading" class="h-9">
            <USkeleton class="h-9 w-48" />
          </div>
          <div v-else class="text-3xl font-bold text-primary">
            {{ (balance / 1_000_000).toFixed(6) }} USDT
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">流水</h2>
          </template>
          <DataTable
            :data="entries"
            :columns="columns"
            :loading="loading"
            empty-message="暂无流水记录"
            @view="viewDetail"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <ModalsWalletDetailModal
    v-model:open="showDetail"
    :detail-item="detailItem"
    :detail-data="detailData"
    :loading-detail="loadingDetail"
  />
</template>
