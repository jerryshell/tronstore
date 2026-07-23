<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const { copy, copied } = useClipboard();
const toast = useToast();
const { useAmountColumn, useDateColumn, useBalanceColumn, useCreditAmountColumn } =
  await import("~/utils/table-columns");

watch(copied, (val) => {
  if (val) toast.add({ title: "地址已复制", color: "success" });
});

const user = ref<any>(null);
const deposits = ref<any[]>([]);
const orders = ref<any[]>([]);
const ledger = ref<any[]>([]);
const loading = ref(true);

const depositColumns = [useAmountColumn(), useCreditAmountColumn(), useDateColumn()];
const orderColumns = [
  { accessorKey: "productSnapshot.name", header: "商品" },
  useAmountColumn("金额"),
  useDateColumn(),
];
const ledgerColumns = [
  { accessorKey: "type", header: "类型" },
  useAmountColumn(),
  useBalanceColumn(),
  useDateColumn(),
];

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
    user.value = u as any;
    deposits.value = ((d as any).items || []) as any[];
    orders.value = ((o as any).items || []) as any[];
    ledger.value = ((l as any).items || []) as any[];
  } catch {}
  loading.value = false;
}

function copyAddress(address: string) {
  if (!address) return;
  copy(address).catch(() => {
    toast.add({ title: "复制失败", color: "error" });
  });
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
        <AdminUserInfoCard :user="user" @copy="copyAddress" />

        <UTabs
          :items="[
            { label: '充值记录', slot: 'deposits' },
            { label: '订单', slot: 'orders' },
            { label: '流水', slot: 'ledger' },
          ]"
        >
          <template #deposits>
            <UTable v-if="deposits.length > 0" :data="deposits" :columns="depositColumns" />
            <div v-else class="text-center py-8 text-muted-foreground">暂无记录</div>
          </template>
          <template #orders>
            <UTable v-if="orders.length > 0" :data="orders" :columns="orderColumns" />
            <div v-else class="text-center py-8 text-muted-foreground">暂无记录</div>
          </template>
          <template #ledger>
            <UTable v-if="ledger.length > 0" :data="ledger" :columns="ledgerColumns" />
            <div v-else class="text-center py-8 text-muted-foreground">暂无记录</div>
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>
</template>
