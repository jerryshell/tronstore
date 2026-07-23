<template>
  <div v-if="loading" class="space-y-2">
    <USkeleton v-for="i in skeletonCount" :key="i" class="h-12 w-full" />
  </div>
  <div v-else class="text-center text-muted-foreground py-12">
    {{ emptyMessage }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
}>();
</script>
