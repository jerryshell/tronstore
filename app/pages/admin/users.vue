<script setup lang="ts">
import type { User } from "~~/shared/types";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const users = ref<User[]>([]);
const loading = ref(true);
const showDetail = ref(false);
const detailUser = ref<User | null>(null);

async function fetch() {
  loading.value = true;
  try {
    users.value = await $fetch("/api/admin/users");
  } catch {}
  loading.value = false;
}

async function viewDetail(userId: string) {
  showDetail.value = true;
  detailUser.value = null;
  try {
    detailUser.value = await $fetch(`/api/admin/users/${userId}`);
  } catch {}
}

async function saveFeeRate(userId: string, feeRateBps: number | null) {
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: { feeRateBps },
    });
    toast.add({ title: "费率更新成功", color: "success" });
    if (detailUser.value) {
      detailUser.value.feeRateBps = feeRateBps;
    }
    await fetch();
  } catch (error: any) {
    toast.add({ title: error.data?.message || "更新失败", color: "error" });
  }
}

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="用户管理" />
    </template>

    <template #body>
      <div class="p-6">
        <UTable
          v-if="!loading && users.length > 0"
          :data="users"
          :columns="[
            { accessorKey: 'email', header: '邮箱' },
            { accessorKey: 'role', header: '角色' },
            {
              accessorKey: 'balance',
              header: '余额',
              cell: ({ row }: any) => (row.original.balance / 1_000_000).toFixed(6) + ' USDT',
            },
            {
              accessorKey: 'depositAddress',
              header: '充值地址',
              cell: ({ row }: any) => row.original.depositAddress || '未分配',
            },
            {
              accessorKey: 'feeRateBps',
              header: '费率',
              cell: ({ row }: any) => {
                const bps = row.original.feeRateBps;
                return bps != null ? ((bps / 10000) * 100).toFixed(2) + '%' : '默认';
              },
            },
            {
              accessorKey: 'createdAt',
              header: '注册时间',
              cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleString(),
            },
            { id: 'actions', header: '操作' },
          ]"
        >
          <template #actions-cell="{ row }">
            <UButton size="xs" @click="viewDetail(row.original.id)">详情</UButton>
          </template>
        </UTable>

        <div v-else-if="loading" class="space-y-2">
          <USkeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>
        <div v-else class="text-center text-muted-foreground py-12">暂无用户</div>
      </div>
    </template>
  </UDashboardPanel>

  <ModalsUserDetailModal
    v-model:open="showDetail"
    :detail-user="detailUser"
    @save-fee-rate="saveFeeRate"
  />
</template>
