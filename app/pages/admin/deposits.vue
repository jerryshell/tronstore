<script setup lang="ts">
import type { Deposit } from "../../../shared/types";

definePageMeta({
  middleware: ["auth"],
});

const { formatDate } = useTimezone();

const {
  items: deposits,
  loading,
  hasMore,
  fetch,
  loadMore,
} = useCursorPagination<Deposit>("/api/admin/deposits");

const columns = [
  { accessorKey: "userEmail", header: "用户邮箱" },
  ...depositAmountColumns(),
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
  dateColumn(formatDate),
];

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
