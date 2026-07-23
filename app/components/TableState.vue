<template>
  <div v-if="loading" class="space-y-2">
    <USkeleton v-for="i in skeletonCount" :key="i" :class="skeletonClass" />
  </div>
  <div v-else class="text-center text-muted-foreground py-12">
    {{ emptyMessage }}
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    loading: boolean;
    emptyMessage?: string;
    skeletonCount?: number;
    skeletonClass?: string;
  }>(),
  {
    emptyMessage: "暂无数据",
    skeletonCount: 5,
    skeletonClass: "h-10 w-full",
  },
);
</script>
