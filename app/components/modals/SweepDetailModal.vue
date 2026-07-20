<script setup lang="ts">
defineProps<{
  detailTask: any;
  loadingDetail: boolean;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" title="归集任务详情" :ui="{ content: 'max-w-4xl' }">
    <template #body>
      <div v-if="loadingDetail" class="space-y-2">
        <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
      </div>
      <div v-else-if="detailTask" class="space-y-4">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <span class="text-muted-foreground">状态</span>
          <span>{{ detailTask.status }}</span>
          <span class="text-muted-foreground">目标地址</span>
          <span class="break-all text-xs">{{ detailTask.targetAddress }}</span>
          <span class="text-muted-foreground">归集总额</span>
          <span>{{ (detailTask.totalAmount / 1_000_000).toFixed(6) }} USDT</span>
          <span class="text-muted-foreground">开始时间</span>
          <span>{{ new Date(detailTask.startedAt).toLocaleString() }}</span>
          <span class="text-muted-foreground">完成时间</span>
          <span>{{
            detailTask.finishedAt ? new Date(detailTask.finishedAt).toLocaleString() : "-"
          }}</span>
        </div>

        <div v-if="detailTask.error" class="text-sm text-error">错误：{{ detailTask.error }}</div>

        <div v-if="detailTask.items?.length > 0">
          <h3 class="text-sm font-medium mb-2">归集明细</h3>
          <UTable
            :data="detailTask.items"
            :columns="[
              { accessorKey: 'address', header: '地址' },
              {
                accessorKey: 'amount',
                header: '金额',
                cell: ({ row }: any) => (row.original.amount / 1_000_000).toFixed(6),
              },
              {
                accessorKey: 'status',
                header: '状态',
                cell: ({ row }: any) => {
                  const s = row.original.status;
                  const colors: Record<string, string> = {
                    pending: 'neutral',
                    gas_sent: 'info',
                    done: 'success',
                    failed: 'error',
                    skipped: 'warning',
                  };
                  return h(
                    resolveComponent('UBadge'),
                    { color: colors[s] || 'neutral', variant: 'soft' },
                    () => s,
                  );
                },
              },
              {
                accessorKey: 'txHash',
                header: '交易哈希',
                cell: ({ row }: any) => row.original.txHash || '-',
              },
              {
                accessorKey: 'error',
                header: '错误',
                cell: ({ row }: any) => row.original.error || '-',
              },
            ]"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
