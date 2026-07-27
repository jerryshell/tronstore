<script setup lang="ts">
// No auth middleware - products are publicly browsable

const auth = useAuth();
const toast = useToast();
const products = ref<any[]>([]);
const loading = ref(true);
const buyingId = ref<string | null>(null);
const showConfirm = ref(false);
const targetProduct = ref<any>(null);
const buying = ref(false);

const balance = computed(() => {
  const b = auth.user?.value?.balance;
  return b != null ? formatUsdt(b) : null;
});

async function fetch() {
  loading.value = true;
  try {
    // Refresh user balance
    await auth.fetchUser();
    const data = await $fetch("/api/products");
    products.value = (data as any).items || [];
  } finally {
    loading.value = false;
  }
}

function confirmBuy(product: any) {
  if (!auth.isLoggedIn.value) {
    navigateTo("/login");
    return;
  }
  targetProduct.value = product;
  showConfirm.value = true;
}

async function buy() {
  if (!targetProduct.value) return;
  buying.value = true;
  try {
    await $fetch("/api/orders", {
      method: "POST",
      body: { productId: targetProduct.value.id },
    });
    toast.add({ title: "购买成功！", color: "success" });
    showConfirm.value = false;
    targetProduct.value = null;
    useAuth().fetchUser();
  } catch (error: any) {
    toast.add({ title: error.data?.message || "购买失败", color: "error" });
  } finally {
    buying.value = false;
  }
}

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="商品">
        <template #right>
          <div v-if="balance != null" class="text-sm font-medium text-primary">
            {{ balance }} USDT
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div
          v-if="!loading && products.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <ProductsProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
            @buy="confirmBuy"
          />
        </div>

        <div v-else-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <USkeleton v-for="i in 6" :key="i" class="h-48 rounded-lg" />
        </div>
        <div v-else class="text-center text-muted-foreground py-12">暂无商品</div>
      </div>
    </template>
  </UDashboardPanel>

  <ModalsPurchaseConfirmModal
    v-model:open="showConfirm"
    :product="targetProduct"
    :balance="auth.user?.value?.balance ?? 0"
    :loading="buying"
    @confirm="buy"
    @close="showConfirm = false"
  />
</template>
