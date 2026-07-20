<script setup lang="ts">
defineProps<{
  detailItem: any;
  detailData: any;
  loadingDetail: boolean;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" title="流水详情" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div v-if="loadingDetail" class="space-y-2">
        <USkeleton v-for="i in 3" :key="i" class="h-8 w-full" />
      </div>
      <div v-else-if="detailItem" class="space-y-3 text-sm">
        <div class="grid grid-cols-[100px_1fr] gap-2">
          <span class="text-muted-foreground">类型</span>
          <span>{{ detailItem.type === "deposit" ? "充值" : "购买" }}</span>

          <span class="text-muted-foreground">金额</span>
          <span>{{ (detailItem.amount / 1_000_000).toFixed(6) }} USDT</span>

          <span class="text-muted-foreground">余额</span>
          <span>{{ (detailItem.balanceAfter / 1_000_000).toFixed(6) }} USDT</span>

          <span class="text-muted-foreground">时间</span>
          <span>{{ new Date(detailItem.createdAt).toLocaleString() }}</span>
        </div>

        <template v-if="detailData">
          <USeparator />

          <div v-if="detailItem.type === 'deposit'" class="grid grid-cols-[100px_1fr] gap-2">
            <span class="text-muted-foreground">交易哈希</span>
            <span class="break-all text-xs">{{ detailData.txHash }}</span>

            <span class="text-muted-foreground">手续费率</span>
            <span>{{ (detailData.feeRateBps / 100).toFixed(2) }}%</span>

            <span class="text-muted-foreground">手续费</span>
            <span>{{ (detailData.feeAmount / 1_000_000).toFixed(6) }} USDT</span>

            <span class="text-muted-foreground">到账金额</span>
            <span>{{ (detailData.creditAmount / 1_000_000).toFixed(6) }} USDT</span>

            <span class="text-muted-foreground">发送地址</span>
            <span class="break-all text-xs">{{ detailData.from }}</span>

            <span class="text-muted-foreground">区块号</span>
            <span>{{ detailData.blockNumber }}</span>
          </div>

          <div v-else-if="detailItem.type === 'purchase'" class="grid grid-cols-[100px_1fr] gap-2">
            <span class="text-muted-foreground">商品名称</span>
            <span>{{ detailData.productSnapshot?.name }}</span>

            <span class="text-muted-foreground">商品描述</span>
            <span>{{ detailData.productSnapshot?.description || "-" }}</span>

            <span class="text-muted-foreground">购买价格</span>
            <span>{{ (detailData.price / 1_000_000).toFixed(6) }} USDT</span>
          </div>
        </template>
      </div>
    </template>
  </UModal>
</template>
