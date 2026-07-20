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
  <UModal v-model:open="open" title="确认删除">
    <template #body>
      <p class="text-muted-foreground">确定要删除「{{ name }}」吗？此操作不可撤销。</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" @click="$emit('close')">取消</UButton>
        <UButton color="error" :loading="loading" @click="$emit('confirm')">确认删除</UButton>
      </div>
    </template>
  </UModal>
</template>
