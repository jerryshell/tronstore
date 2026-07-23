<script setup lang="ts">
import type { Deposit } from "../../../shared/types";

definePageMeta({
  middleware: ["auth"],
});

const { formatDate } = useTimezone();

const deposits = ref<Deposit[]>([]);
const loading = ref(true);
const cursor = ref<string | null>(null);
const hasMore = ref(false);

const columns = [
  { accessorKey: "userEmail", header: "用户邮箱" },
  {
    accessorKey: "amount",
    header: "金额",
    cell: ({ row }: any) => (row.original.amount / 1_000_000).toFixed(6) + " USDT",
  },
  {
    accessorKey: "feeRateBps",
    header: "手续费率",
    cell: ({ row }: any) => (row.original.feeRateBps / 100).toFixed(2) + "%",
  },
  {
    accessorKey: "feeAmount",
    header: "手续费",
    cell: ({ row }: any) => (row.original.feeAmount / 1_000_000).toFixed(6) + " USDT",
  },
  {
    accessorKey: "creditAmount",
    header: "到账",
    cell: ({ row }: any) => (row.original.creditAmount / 1_000_000).toFixed(6) + " USDT",
  },
  {
    accessorKey: "txHash",
    header: "交易哈希",
    cell: ({ row }: any) => {
      const hash = row.original.txHash;
      return hash ? hash.slice(0, 8) + "..." + hash.slice(-6) : "-";
    },
  },
  {
    accessorKey: "blockNumber",
    header: "区块号",
  },
  {
    accessorKey: "createdAt",
    header: "时间",
    cell: ({ row }: any) => formatDate(row.original.createdAt),
  },
];

async function fetch(append = false) {
  loading.value = true;
  try {
    const query: any = { limit: 50 };
    if (append && cursor.value) {
      query.cursor = cursor.value;
    }

    const data = await $fetch<any>("/api/admin/deposits", { query });

    const items = (data.items || []) as Deposit[];
    if (append) {
      deposits.value = [...deposits.value, ...items];
    } else {
      deposits.value = items;
    }

    cursor.value = data.cursor;
    hasMore.value = !!data.cursor;
  } catch {}
  loading.value = false;
}

function loadMore() {
  fetch(true);
}

onMounted(() => fetch());
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="充值记录" />
    </template>

    <template #body>
      <div class="p-6">
        <UTable v-if="!loading && deposits.length > 0" :data="deposits" :columns="columns" />

        <AdminTableState v-else :loading="loading" empty-message="暂无充值记录" />

        <div v-if="hasMore" class="mt-4 text-center">
          <UButton variant="outline" :loading="loading" @click="loadMore"> 加载更多 </UButton>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
