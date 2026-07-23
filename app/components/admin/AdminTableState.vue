<template>
  <TableState
    :loading="loading"
    :empty-message="emptyMessage"
    :skeleton-count="skeletonCount"
    skeleton-class="h-12 w-full"
  />
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
}>();
</script>
