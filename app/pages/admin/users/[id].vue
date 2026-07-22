<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();

const { formatDate } = useTimezone();

const user = ref<any>(null);
const deposits = ref<any[]>([]);
const orders = ref<any[]>([]);
const ledger = ref<any[]>([]);
const loading = ref(true);

async function fetch() {
  loading.value = true;
  try {
    const uid = route.params.id as string;
    const [u, d, o, l] = await Promise.all([
      $fetch(`/api/admin/users/${uid}`),
      $fetch(`/api/admin/users/${uid}/deposits`),
      $fetch(`/api/admin/users/${uid}/orders`),
      $fetch(`/api/admin/users/${uid}/ledger`),
    ]);
    user.value = u;
    deposits.value = (d as any).items || [];
    orders.value = (o as any).items || [];
    ledger.value = (l as any).items || [];
  } catch {}
  loading.value = false;
}

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="用户详情" />
    </template>

    <template #body>
      <div v-if="loading" class="p-6 space-y-6">
        <USkeleton class="h-48 rounded-lg" />
        <USkeleton class="h-64 rounded-lg" />
      </div>
      <div v-else-if="user" class="p-6 space-y-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">基本信息</h2>
          </template>
          <dl class="space-y-2">
            <div class="flex justify-between">
              <span class="text-muted-foreground">邮箱</span><span>{{ user.email }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">角色</span><span>{{ user.role }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">余额</span>
              <span>{{ (user.balance / 1_000_000).toFixed(6) }} USDT</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">费率</span
              ><span>{{ user.effectiveFeeRateBps }} bps</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">充值地址</span>
              <span class="font-mono text-sm">{{ user.depositAddress || "未分配" }}</span>
            </div>
          </dl>
        </UCard>

        <UTabs
          :items="[
            { label: '充值记录', slot: 'deposits' },
            { label: '订单', slot: 'orders' },
            { label: '流水', slot: 'ledger' },
          ]"
        >
          <template #deposits>
            <UTable
              v-if="deposits.length > 0"
              :data="deposits"
              :columns="[
                {
                  accessorKey: 'amount',
                  header: '金额',
                  cell: ({ row }: any) => (row.original.amount / 1_000_000).toFixed(6),
                },
                {
                  accessorKey: 'creditAmount',
                  header: '到账',
                  cell: ({ row }: any) => (row.original.creditAmount / 1_000_000).toFixed(6),
                },
                {
                  accessorKey: 'createdAt',
                  header: '时间',
                  cell: ({ row }: any) => formatDate(row.original.createdAt),
                },
              ]"
            />
            <div v-else class="text-center py-8 text-muted-foreground">暂无记录</div>
          </template>
          <template #orders>
            <UTable
              v-if="orders.length > 0"
              :data="orders"
              :columns="[
                { accessorKey: 'productSnapshot.name', header: '商品' },
                {
                  accessorKey: 'price',
                  header: '金额',
                  cell: ({ row }: any) => (row.original.price / 1_000_000).toFixed(6),
                },
                {
                  accessorKey: 'createdAt',
                  header: '时间',
                  cell: ({ row }: any) => formatDate(row.original.createdAt),
                },
              ]"
            />
            <div v-else class="text-center py-8 text-muted-foreground">暂无记录</div>
          </template>
          <template #ledger>
            <UTable
              v-if="ledger.length > 0"
              :data="ledger"
              :columns="[
                { accessorKey: 'type', header: '类型' },
                {
                  accessorKey: 'amount',
                  header: '金额',
                  cell: ({ row }: any) => (row.original.amount / 1_000_000).toFixed(6),
                },
                {
                  accessorKey: 'balanceAfter',
                  header: '余额',
                  cell: ({ row }: any) => (row.original.balanceAfter / 1_000_000).toFixed(6),
                },
                {
                  accessorKey: 'createdAt',
                  header: '时间',
                  cell: ({ row }: any) => formatDate(row.original.createdAt),
                },
              ]"
            />
            <div v-else class="text-center py-8 text-muted-foreground">暂无记录</div>
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>
</template>
