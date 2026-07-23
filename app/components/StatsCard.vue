<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">{{ title }}</h2>
    </template>
    <div class="text-3xl font-bold" :class="{ 'text-primary': highlight }">
      {{ formattedValue }}
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  value: number;
  highlight?: boolean;
  isAmount?: boolean;
}>();

const formattedValue = computed(() => {
  if (props.isAmount) {
    return (props.value / 1_000_000).toFixed(6) + " USDT";
  }
  return props.value.toLocaleString();
});
</script>
