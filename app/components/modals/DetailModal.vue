<script setup lang="ts">
defineProps<{
  title: string;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" :title="title" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <slot />
    </template>
  </UModal>
</template>
