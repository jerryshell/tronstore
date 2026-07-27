<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold">{{ product.name }}</h3>
    </template>
    <p class="text-sm text-muted-foreground mb-4">{{ product.description }}</p>
    <div class="flex items-center justify-between">
      <span class="text-lg font-bold text-primary">
        {{ formatUsdtLabel(product.price) }}
      </span>
      <UButton @click="$emit('buy', product)">购买</UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  product: any;
}>();

defineEmits<{
  buy: [product: any];
}>();
</script>
