<script setup lang="ts">
import { UBadge } from "#components";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const { formatDate } = useTimezone();

const tasks = ref<any[]>([]);
const loading = ref(true);
const triggering = ref(false);
const showConfirm = ref(false);
const showDetail = ref(false);
const detailTask = ref<any>(null);
const loadingDetail = ref(false);

const columns = [
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }: any) => {
      const status = row.original.status;
      const colors: Record<string, "info" | "success" | "error" | "warning"> = {
        running: "info",
        done: "success",
        failed: "error",
        interrupted: "warning",
      };
      return h(UBadge, { color: colors[status] || "neutral" }, () => status);
    },
  },
  {
    accessorKey: "totalAmount",
    header: "归集总额",
    cell: ({ row }: any) => formatUsdtLabel(row.original.totalAmount),
  },
  {
    accessorKey: "startedAt",
    header: "开始时间",
    cell: ({ row }: any) => formatDate(row.original.startedAt),
  },
  {
    accessorKey: "finishedAt",
    header: "完成时间",
    cell: ({ row }: any) => (row.original.finishedAt ? formatDate(row.original.finishedAt) : "-"),
  },
  { id: "actions", header: "操作" },
];

async function fetch() {
  loading.value = true;
  try {
    const data = await $fetch("/api/admin/sweeps");
    tasks.value = (data as any).items || [];
  } catch {}
  loading.value = false;
}

async function triggerSweep() {
  showConfirm.value = false;
  triggering.value = true;
  try {
    await $fetch("/api/admin/sweeps/trigger", { method: "POST" });
    toast.add({ title: "归集任务已触发", color: "success" });
    await fetch();
  } catch (error: any) {
    toast.add({ title: error.data?.message || "触发失败", color: "error" });
  } finally {
    triggering.value = false;
  }
}

async function viewDetail(taskId: string) {
  loadingDetail.value = true;
  showDetail.value = true;
  try {
    detailTask.value = await $fetch(`/api/admin/sweeps/${taskId}`);
  } catch (error: any) {
    toast.add({ title: error.data?.message || "获取详情失败", color: "error" });
    showDetail.value = false;
  } finally {
    loadingDetail.value = false;
  }
}

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="归集任务">
        <template #right>
          <UButton @click="showConfirm = true" :loading="triggering">手动触发归集</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UTable v-if="!loading && tasks.length > 0" :data="tasks" :columns="columns">
          <template #actions-cell="{ row }">
            <UButton size="xs" @click="viewDetail(row.original.id)">详情</UButton>
          </template>
        </UTable>

        <TableState
          v-else
          :loading="loading"
          empty-message="暂无归集任务"
          skeleton-class="h-12 w-full"
        />
      </div>
    </template>
  </UDashboardPanel>

  <ModalsSweepConfirmModal
    v-model:open="showConfirm"
    :loading="triggering"
    @confirm="triggerSweep"
    @close="showConfirm = false"
  />

  <ModalsSweepDetailModal
    v-model:open="showDetail"
    :detail-task="detailTask"
    :loading-detail="loadingDetail"
  />
</template>
