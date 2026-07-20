<script setup lang="ts">
defineProps<{
  product: any;
  balance: number;
  loading?: boolean;
}>();

defineEmits<{
  (e: "confirm"): void;
  (e: "close"): void;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" title="确认购买">
    <template #body>
      <div v-if="product" class="space-y-3 text-sm">
        <p>确定要购买以下商品吗？</p>
        <div class="p-3 bg-muted rounded-lg">
          <p class="font-medium">{{ product.name }}</p>
          <p class="text-muted-foreground">{{ product.description }}</p>
          <p class="mt-2 font-bold">{{ (product.price / 1_000_000).toFixed(6) }} USDT</p>
        </div>
        <p class="text-muted-foreground">当前余额：{{ (balance / 1_000_000).toFixed(6) }} USDT</p>
        <p v-if="balance < product.price" class="text-error">余额不足，请先充值。</p>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" @click="$emit('close')">取消</UButton>
        <UButton
          color="primary"
          :loading="loading"
          :disabled="!product || balance < product.price"
          @click="$emit('confirm')"
        >
          确认购买
        </UButton>
      </div>
    </template>
  </UModal>
</template>
