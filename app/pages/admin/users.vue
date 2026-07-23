<script setup lang="ts">
import type { User } from "~~/shared/types";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const { formatDate } = useTimezone();
const { copy, copied } = useClipboard();
const config = useRuntimeConfig();
const tronNetwork = config.public.tronNetwork as string;

watch(copied, (val) => {
  if (val) toast.add({ title: "地址已复制", color: "success" });
});

const users = ref<User[]>([]);
const loading = ref(true);
const showDetail = ref(false);
const detailUser = ref<User | null>(null);
const showAddressDetail = ref(false);
const selectedAddress = ref<string>("");

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

function copyAddress(address: string) {
  if (!address) return;
  copy(address).catch(() => {
    toast.add({ title: "复制失败", color: "error" });
  });
}

function openAddressDetail(address: string) {
  if (!address) return;
  selectedAddress.value = address;
  showAddressDetail.value = true;
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
              id: 'depositAddress',
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
              cell: ({ row }: any) => formatDate(row.original.createdAt),
            },
            { id: 'actions', header: '操作' },
          ]"
        >
          <template #actions-cell="{ row }">
            <UButton size="xs" @click="viewDetail(row.original.id)">详情</UButton>
          </template>
          <template #depositAddress-cell="{ row }">
            <div v-if="row.original.depositAddress" class="flex items-center gap-2">
              <UButton
                variant="link"
                class="font-mono text-xs p-0 h-auto"
                @click="openAddressDetail(row.original.depositAddress)"
              >
                {{ row.original.depositAddress }}
              </UButton>
              <UButton
                icon="i-lucide-copy"
                variant="ghost"
                size="xs"
                title="复制地址"
                @click="copyAddress(row.original.depositAddress)"
              />
              <UButton
                icon="i-lucide-external-link"
                variant="ghost"
                size="xs"
                title="在 TronScan 中查看"
                :to="
                  tronNetwork === 'mainnet'
                    ? `https://tronscan.org/#/address/${row.original.depositAddress}`
                    : `https://nile.tronscan.org/#/address/${row.original.depositAddress}`
                "
                target="_blank"
              />
            </div>
            <span v-else>未分配</span>
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

  <ModalsAddressDetailModal v-model:open="showAddressDetail" :address="selectedAddress" />
</template>
