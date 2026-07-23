<script setup lang="ts">
const auth = useAuth();

watch(
  () => [auth.loading.value, auth.isLoggedIn.value],
  ([loading, loggedIn]) => {
    if (!loading && !loggedIn) {
      navigateTo("/products");
    }
  },
  { immediate: true },
);

const adminStats = ref<{
  userCount: number;
  depositCount: number;
  orderCount: number;
  totalBalance: number;
} | null>(null);
const loadingStats = ref(true);

onMounted(async () => {
  // 直接刷新时 auth 可能仍在加载，等待首次检查完成
  if (auth.loading.value) {
    await until(auth.loading).toBe(false);
  }
  if (auth.isAdmin.value) {
    try {
      adminStats.value = await $fetch("/api/admin/stats");
    } catch {}
  }
  loadingStats.value = false;
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="首页" />
    </template>

    <template #body>
      <div v-if="!auth.isLoggedIn.value" class="p-6 text-center text-muted-foreground">
        正在跳转...
      </div>
      <div v-else class="p-6 space-y-6">
        <template v-if="!auth.isAdmin.value && auth.user?.value">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold">余额</h2>
            </template>
            <div class="text-3xl font-bold text-primary">
              {{ (auth.user.value.balance / 1_000_000).toFixed(6) }} USDT
            </div>
          </UCard>
        </template>

        <template v-if="auth.isAdmin.value">
          <div v-if="loadingStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <USkeleton class="h-32 rounded-lg" />
            <USkeleton class="h-32 rounded-lg" />
            <USkeleton class="h-32 rounded-lg" />
            <USkeleton class="h-32 rounded-lg" />
          </div>
          <div v-else-if="adminStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="用户总数" :value="adminStats.userCount" />
            <StatsCard title="充值笔数" :value="adminStats.depositCount" />
            <StatsCard title="订单总数" :value="adminStats.orderCount" />
            <StatsCard
              title="平台总余额"
              :value="adminStats.totalBalance"
              :is-amount="true"
              :highlight="true"
            />
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
