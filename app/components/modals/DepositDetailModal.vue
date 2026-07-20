<script setup lang="ts">
defineProps<{
  detailItem: any;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" title="充值详情" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div v-if="detailItem" class="space-y-3 text-sm">
        <div class="grid grid-cols-[100px_1fr] gap-2">
          <span class="text-muted-foreground">交易哈希</span>
          <span class="break-all text-xs">{{ detailItem.txHash }}</span>

          <span class="text-muted-foreground">金额</span>
          <span>{{ (detailItem.amount / 1_000_000).toFixed(6) }} USDT</span>

          <span class="text-muted-foreground">手续费率</span>
          <span>{{ (detailItem.feeRateBps / 100).toFixed(2) }}%</span>

          <span class="text-muted-foreground">手续费</span>
          <span>{{ (detailItem.feeAmount / 1_000_000).toFixed(6) }} USDT</span>

          <span class="text-muted-foreground">到账金额</span>
          <span>{{ (detailItem.creditAmount / 1_000_000).toFixed(6) }} USDT</span>

          <span class="text-muted-foreground">发送地址</span>
          <span class="break-all text-xs">{{ detailItem.from }}</span>

          <span class="text-muted-foreground">接收地址</span>
          <span class="break-all text-xs">{{ detailItem.to }}</span>

          <span class="text-muted-foreground">区块号</span>
          <span>{{ detailItem.blockNumber }}</span>

          <span class="text-muted-foreground">区块时间</span>
          <span>{{ new Date(detailItem.blockTime).toLocaleString() }}</span>

          <span class="text-muted-foreground">创建时间</span>
          <span>{{ new Date(detailItem.createdAt).toLocaleString() }}</span>
        </div>
      </div>
    </template>
  </UModal>
</template>
