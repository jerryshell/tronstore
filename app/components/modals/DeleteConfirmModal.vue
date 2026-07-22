<script setup lang="ts">
defineProps<{
  name?: string;
  loading?: boolean;
}>();

defineEmits<{
  (e: "confirm"): void;
  (e: "close"): void;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" title="确认删除" :ui="{ footer: 'justify-end' }">
    <template #body>
      <p class="text-muted-foreground">确定要删除「{{ name }}」吗？此操作不可撤销。</p>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton color="error" :loading="loading" @click="$emit('confirm')">确认删除</UButton>
      </div>
    </template>
  </UModal>
</template>
