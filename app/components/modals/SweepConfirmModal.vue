<script setup lang="ts">
defineProps<{
  loading?: boolean;
}>();

defineEmits<{
  (e: "confirm"): void;
  (e: "close"): void;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" title="确认触发归集" :ui="{ footer: 'justify-end' }">
    <template #body>
      <p class="text-muted-foreground">
        确定要手动触发归集任务吗？这将遍历所有地址并执行 USDT 归集操作。
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton color="primary" :loading="loading" @click="$emit('confirm')">确认触发</UButton>
      </div>
    </template>
  </UModal>
</template>
