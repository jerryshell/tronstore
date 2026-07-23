<template>
  <UTable v-if="!loading && data.length > 0" :data="data" :columns="columns">
    <template #actions-cell="{ row }">
      <UButton size="xs" @click="emit('view', row.original)">详情</UButton>
    </template>
  </UTable>
  <TableState
    v-else
    :loading="loading"
    :empty-message="emptyMessage"
    :skeleton-count="skeletonCount"
    :skeleton-class="skeletonClass"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    data: any[];
    columns: any[];
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

const emit = defineEmits<{
  (e: "view", row: any): void;
}>();
</script>
