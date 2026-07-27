<script setup lang="ts">
const { formatDate } = useTimezone();

defineProps<{
  detailOrder: any;
  admin?: boolean;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" title="订单详情" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div v-if="detailOrder" class="space-y-3 text-sm">
        <div class="grid grid-cols-[100px_1fr] gap-2">
          <template v-if="admin">
            <span class="text-muted-foreground">订单ID</span>
            <span class="break-all text-xs">{{ detailOrder.id }}</span>

            <span class="text-muted-foreground">用户邮箱</span>
            <span>{{ detailOrder.userEmail }}</span>

            <span class="text-muted-foreground">用户ID</span>
            <span class="break-all text-xs">{{ detailOrder.userId }}</span>
          </template>

          <span class="text-muted-foreground">商品名称</span>
          <span>{{ detailOrder.productSnapshot?.name }}</span>

          <span class="text-muted-foreground">商品描述</span>
          <span>{{ detailOrder.productSnapshot?.description || "-" }}</span>

          <span class="text-muted-foreground">购买价格</span>
          <span>{{ formatUsdtLabel(detailOrder.price) }}</span>

          <span class="text-muted-foreground">下单时间</span>
          <span>{{ formatDate(detailOrder.createdAt) }}</span>
        </div>
      </div>
    </template>
  </UModal>
</template>
