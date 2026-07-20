<script setup lang="ts">
import type { User } from "~~/shared/types";

const props = defineProps<{
  detailUser: User | null;
}>();

const emit = defineEmits<{
  (e: "saveFeeRate", userId: string, feeRate: number | null): void;
}>();

const open = defineModel<boolean>("open", { required: true });

const editFeeRate = ref<number | null>(null);
const savingFeeRate = ref(false);

watch(
  () => props.detailUser,
  (user) => {
    if (user) {
      editFeeRate.value = user.feeRateBps != null ? user.feeRateBps / 10000 : null;
    }
  },
);

async function saveFeeRate() {
  if (!props.detailUser) return;
  savingFeeRate.value = true;
  try {
    const feeRateBps = editFeeRate.value != null ? Math.round(editFeeRate.value * 10000) : null;
    emit("saveFeeRate", props.detailUser.id, feeRateBps);
  } finally {
    savingFeeRate.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="用户详情" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div v-if="!detailUser" class="space-y-2">
        <USkeleton v-for="i in 4" :key="i" class="h-8 w-full" />
      </div>
      <div v-else class="space-y-4 text-sm">
        <div class="grid grid-cols-[120px_1fr] gap-2">
          <span class="text-muted-foreground">ID</span>
          <span class="break-all text-xs">{{ detailUser.id }}</span>

          <span class="text-muted-foreground">邮箱</span>
          <span>{{ detailUser.email }}</span>

          <span class="text-muted-foreground">角色</span>
          <span>{{ detailUser.role }}</span>

          <span class="text-muted-foreground">余额</span>
          <span>{{ (detailUser.balance / 1_000_000).toFixed(6) }} USDT</span>

          <span class="text-muted-foreground">充值地址</span>
          <span class="break-all text-xs">{{ detailUser.depositAddress || "未分配" }}</span>

          <span class="text-muted-foreground">注册时间</span>
          <span>{{ new Date(detailUser.createdAt).toLocaleString() }}</span>
        </div>

        <USeparator />

        <div class="space-y-2">
          <div class="flex items-end gap-2">
            <UFormField label="自定义手续费率" class="flex-1">
              <UInput
                v-model="editFeeRate"
                type="number"
                step="0.0001"
                placeholder="留空则使用默认费率"
                class="w-full"
              />
            </UFormField>
            <UButton :loading="savingFeeRate" @click="saveFeeRate">保存费率</UButton>
          </div>
          <p class="text-xs text-muted-foreground">
            输入小数，如 0.02 代表 2%，留空则使用系统默认费率。
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>
