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
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">用户总数</h2>
              </template>
              <div class="text-3xl font-bold">{{ adminStats.userCount }}</div>
            </UCard>
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">充值笔数</h2>
              </template>
              <div class="text-3xl font-bold">{{ adminStats.depositCount }}</div>
            </UCard>
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">订单总数</h2>
              </template>
              <div class="text-3xl font-bold">{{ adminStats.orderCount }}</div>
            </UCard>
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">平台总余额</h2>
              </template>
              <div class="text-3xl font-bold text-primary">
                {{ (adminStats.totalBalance / 1_000_000).toFixed(6) }} USDT
              </div>
            </UCard>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
