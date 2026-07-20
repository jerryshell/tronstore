<script setup lang="ts">
import QRCode from "qrcode";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const auth = useAuth();
const { copy, copied } = useClipboard();

watch(copied, (val) => {
  if (val) toast.add({ title: "地址已复制", color: "success" });
});

function copyAddress() {
  if (!address.value) return;
  copy(address.value).catch(() => {
    toast.add({ title: "复制失败", color: "error" });
  });
}

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
                <UInput :value="address" readonly class="font-mono text-sm flex-1" />
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
    </template>
  </UDashboardPanel>
</template>
