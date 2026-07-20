<script setup lang="ts">
defineProps<{
  title?: string;
  message?: string;
  loading?: boolean;
  confirmText?: string;
  confirmColor?: string;
}>();

defineEmits<{
  (e: "confirm"): void;
  (e: "close"): void;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" :title="title || '确认操作'">
    <template #body>
      <p class="text-muted-foreground">
        {{ message || "确定要执行此操作吗？" }}
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" @click="$emit('close')">取消</UButton>
        <UButton
          :color="(confirmColor as any) || 'primary'"
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ confirmText || "确认" }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
