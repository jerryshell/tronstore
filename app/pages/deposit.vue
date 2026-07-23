<script setup lang="ts">
import QRCode from "qrcode";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const { copy, copied } = useCopyToast();
const { formatDate } = useTimezone();

watch(copied, (val) => {
  if (val) toast.add({ title: "地址已复制", color: "success" });
});

function copyAddress() {
  if (!address.value) return;
  copy(address.value).catch(() => {
    toast.add({ title: "复制失败", color: "error" });
  });
}

// === 充值地址 ===
const address = ref<string | null>(null);
const effectiveFeeRateBps = ref(200);
const qrCodeSvg = ref("");
const loading = ref(false);

async function fetchAddress() {
  try {
    const data = await $fetch("/api/deposit-address");
    address.value = (data as any).address || null;
    effectiveFeeRateBps.value = (data as any).effectiveFeeRateBps || 200;
  } catch {}
}

async function ensureAddress() {
  loading.value = true;
  try {
    const data = await $fetch("/api/deposit-address/ensure", { method: "POST" });
    address.value = (data as any).address;
    toast.add({ title: "地址分配成功", color: "success" });
    pollAddress();
  } catch (error: any) {
    toast.add({ title: error.data?.message || "分配失败", color: "error" });
  } finally {
    loading.value = false;
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

function pollAddress() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    await fetchAddress();
    if (address.value) {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
    }
  }, 2000);
}

watch(address, async (val) => {
  if (val) {
    try {
      qrCodeSvg.value = await QRCode.toString(val, { type: "svg", width: 200 });
    } catch {}
  }
});

// === 充值记录 ===
const {
  items,
  loading: recordsLoading,
  fetch: fetchRecords,
} = useCursorPagination("/api/deposits");
const { open: showDetail, item: detailItem, show: viewDetail } = useDetailModal();

const columns = [...depositAmountColumns(), dateColumn(formatDate), actionsColumn];

// === Tab 切换 ===
const activeTab = ref("0");
const tabs = [
  { label: "充值地址", icon: "i-lucide-wallet" },
  { label: "充值记录", icon: "i-lucide-list" },
];

function onTabChange(payload: string | number) {
  if (String(payload) === "1" && items.value.length === 0) {
    fetchRecords();
  }
}

onMounted(() => {
  fetchAddress();
  if (!address.value) {
    pollAddress();
  }
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="充值" />
    </template>

    <template #body>
      <div class="p-6">
        <UTabs :items="tabs" v-model="activeTab" @update:model-value="onTabChange" class="mb-6" />

        <!-- 充值地址 -->
        <div v-if="activeTab === '0'">
          <UCard :ui="{ root: 'rounded-lg overflow-hidden ring ring-default' }">
            <template #header>
              <h2 class="text-lg font-semibold">充值信息</h2>
            </template>

            <div v-if="!address" class="text-center py-8 space-y-4">
              <p class="text-muted-foreground">您还没有充值地址</p>
              <UButton @click="ensureAddress" :loading="loading">分配充值地址</UButton>
            </div>

            <div v-else class="space-y-4">
              <div class="space-y-2">
                <p class="text-sm text-muted-foreground">充值地址 (TRC20)</p>
                <div class="flex gap-2">
                  <UInput :model-value="address" readonly class="font-mono text-sm flex-1" />
                  <UButton
                    :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                    variant="outline"
                    @click="copyAddress"
                  />
                </div>
              </div>

              <div class="flex justify-center">
                <div v-if="qrCodeSvg" v-html="qrCodeSvg" class="border p-2 rounded-lg" />
              </div>

              <div class="text-sm text-muted-foreground">
                手续费率：{{ (effectiveFeeRateBps / 100).toFixed(2) }}%
              </div>

              <UAlert
                color="info"
                variant="soft"
                description="请向上述地址转入 USDT (TRC20)，到账后余额将自动更新。"
              />
            </div>
          </UCard>
        </div>

        <!-- 充值记录 -->
        <div v-else>
          <DataTable
            :data="items"
            :columns="columns"
            :loading="recordsLoading"
            empty-message="暂无充值记录"
            :skeleton-count="8"
            @view="viewDetail"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <ModalsDepositDetailModal v-model:open="showDetail" :detail-item="detailItem" />
</template>
