<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const balance = ref(0);
const entries = ref<any[]>([]);
const cursor = ref<string | null>(null);
const loading = ref(true);
const showDetail = ref(false);
const detailItem = ref<any>(null);
const detailData = ref<any>(null);
const loadingDetail = ref(false);

async function fetch() {
  loading.value = true;
  try {
    const [bal, ledger] = await Promise.all([
      $fetch("/api/wallet"),
      $fetch("/api/wallet/ledger", { query: { limit: 50, cursor: cursor.value } }),
    ]);
    balance.value = (bal as any).balance;
    entries.value = (ledger as any).items || [];
    cursor.value = (ledger as any).cursor;
  } catch {}
  loading.value = false;
}

async function viewDetail(entry: any) {
  detailItem.value = entry;
  detailData.value = null;
  showDetail.value = true;
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
          <UTable
            v-if="!loading && entries.length > 0"
            :data="entries"
            :columns="[
              {
                accessorKey: 'type',
                header: '类型',
                cell: ({ row }: any) => (row.original.type === 'deposit' ? '充值' : '购买'),
              },
              {
                accessorKey: 'amount',
                header: '金额',
                cell: ({ row }: any) => (row.original.amount / 1_000_000).toFixed(6) + ' USDT',
              },
              {
                accessorKey: 'balanceAfter',
                header: '余额',
                cell: ({ row }: any) => (row.original.balanceAfter / 1_000_000).toFixed(6),
              },
              {
                accessorKey: 'createdAt',
                header: '时间',
                cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleString(),
              },
              { id: 'actions', header: '操作' },
            ]"
          >
            <template #actions-cell="{ row }">
              <UButton size="xs" @click="viewDetail(row.original)">详情</UButton>
            </template>
          </UTable>

          <div v-else-if="loading" class="space-y-2 py-4">
            <USkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
          </div>
          <div v-else class="text-center text-muted-foreground py-8">暂无流水记录</div>
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
