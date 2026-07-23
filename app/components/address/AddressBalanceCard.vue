<template>
  <div class="mt-4">
    <div v-if="loading" class="space-y-2">
      <USkeleton v-for="i in 3" :key="i" class="h-12 w-full" />
    </div>
    <div v-else-if="data" class="space-y-4">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">账户余额</h3>
        </template>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="text-sm text-muted-foreground">TRX 余额</div>
            <div class="text-2xl font-bold">{{ data.trx?.trx || "0" }} TRX</div>
          </div>
          <div class="space-y-2">
            <div class="text-sm text-muted-foreground">USDT 余额</div>
            <div class="text-2xl font-bold">{{ data.usdt?.usdt || "0" }} USDT</div>
          </div>
        </div>
      </UCard>
      <div class="text-xs text-muted-foreground">
        网络：{{ data.network === "mainnet" ? "主网" : "测试网 (Nile)" }}
      </div>
    </div>
    <div v-else class="text-center py-8 text-muted-foreground">暂无数据</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean;
  data: any;
}>();
</script>
