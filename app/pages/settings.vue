<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const settings = ref<any>(null);
const loading = ref(true);
const saving = ref(false);

// Display values (user-friendly units)
const feeRate = ref(0.02); // 0.02 = 2%
const sweepTargetAddress = ref("");
const sweepGasPoolPrivateKey = ref("");
const sweepThreshold = ref(100); // USDT
const sweepGasTrxAmount = ref(10); // TRX
const sweepIntervalMinutes = ref(60);
const sweepEnabled = ref(false);

// Gas pool balance
const checkingGasPool = ref(false);
const gasPoolBalance = ref<{ address: string; trxBalance: number; usdtBalance: number } | null>(
  null,
);

async function fetch() {
  loading.value = true;
  try {
    const data = await $fetch("/api/admin/settings");
    settings.value = data;
    feeRate.value = (data as any).system.defaultFeeRateBps / 10000;
    sweepTargetAddress.value = (data as any).sweep.targetAddress;
    sweepThreshold.value = (data as any).sweep.threshold / 1_000_000;
    sweepGasTrxAmount.value = (data as any).sweep.gasTrxAmount / 1_000_000;
    sweepIntervalMinutes.value = (data as any).sweep.intervalMinutes;
    sweepEnabled.value = (data as any).sweep.enabled;
  } finally {
    loading.value = false;
  }
}

async function checkGasPoolBalance() {
  checkingGasPool.value = true;
  gasPoolBalance.value = null;
  try {
    gasPoolBalance.value = await $fetch("/api/admin/gas-pool-balance");
  } catch (error: any) {
    toast.add({ title: error.data?.message || "查询失败", color: "error" });
  } finally {
    checkingGasPool.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    await $fetch("/api/admin/settings", {
      method: "PUT",
      body: {
        defaultFeeRateBps: Math.round(feeRate.value * 10000),
        sweepTargetAddress: sweepTargetAddress.value,
        sweepGasPoolPrivateKey: sweepGasPoolPrivateKey.value || undefined,
        sweepThreshold: Math.round(sweepThreshold.value * 1_000_000),
        sweepGasTrxAmount: Math.round(sweepGasTrxAmount.value * 1_000_000),
        sweepIntervalMinutes: sweepIntervalMinutes.value,
        sweepEnabled: sweepEnabled.value,
      },
    });
    toast.add({ title: "设置已保存", color: "success" });
    sweepGasPoolPrivateKey.value = "";
    await fetch();
  } catch (error: any) {
    toast.add({ title: error.data?.message || "保存失败", color: "error" });
  } finally {
    saving.value = false;
  }
}

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="系统设置" />
    </template>

    <template #body>
      <div v-if="loading" class="p-6 space-y-6">
        <USkeleton class="h-32 rounded-lg" />
        <USkeleton class="h-64 rounded-lg" />
      </div>
      <div v-else-if="settings" class="p-6 space-y-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">手续费</h2>
          </template>
          <div class="space-y-4">
            <UFormField label="默认手续费率">
              <UInput v-model="feeRate" type="number" step="0.0001" class="w-full" />
            </UFormField>
            <p class="text-sm text-muted-foreground">
              输入小数，如 0.02 代表 2%，可为每个用户单独设置
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">归集配置</h2>
          </template>
          <div class="space-y-4">
            <UFormField label="启用归集">
              <USwitch v-model="sweepEnabled" />
            </UFormField>
            <UFormField label="归集目标地址">
              <UInput v-model="sweepTargetAddress" placeholder="T..." class="w-full" />
            </UFormField>
            <UFormField label="Gas 池私钥 (留空不修改)">
              <div class="flex gap-2">
                <UInput
                  v-model="sweepGasPoolPrivateKey"
                  type="password"
                  :placeholder="settings.sweep.hasGasPoolKey ? '已设置（留空不修改）' : '私钥'"
                  class="flex-1"
                />
                <UButton
                  variant="outline"
                  :loading="checkingGasPool"
                  :disabled="!settings.sweep.hasGasPoolKey"
                  @click="checkGasPoolBalance"
                >
                  检查余量
                </UButton>
              </div>
            </UFormField>

            <div v-if="gasPoolBalance" class="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div class="flex justify-between">
                <span class="text-muted-foreground">地址</span>
                <span class="break-all text-xs">{{ gasPoolBalance.address }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">TRX 余额</span>
                <span class="font-medium"
                  >{{ (gasPoolBalance.trxBalance / 1_000_000).toFixed(6) }} TRX</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">USDT 余额</span>
                <span class="font-medium"
                  >{{ (gasPoolBalance.usdtBalance / 1_000_000).toFixed(6) }} USDT</span
                >
              </div>
            </div>

            <UFormField label="单地址归集阈值 (USDT)">
              <UInput v-model="sweepThreshold" type="number" step="0.01" class="w-full" />
            </UFormField>
            <UFormField label="每次补 Gas 数量 (TRX)">
              <UInput v-model="sweepGasTrxAmount" type="number" step="0.1" class="w-full" />
            </UFormField>
            <UFormField label="归集间隔 (分钟)">
              <UInput v-model="sweepIntervalMinutes" type="number" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <UButton @click="save" block :loading="saving">保存设置</UButton>
      </div>
    </template>
  </UDashboardPanel>
</template>
