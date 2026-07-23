<script setup lang="ts">
import type { User } from "../../../shared/types";

const { formatDate } = useTimezone();
const { copy, copied } = useClipboard();
const toast = useToast();
const config = useRuntimeConfig();
const tronNetwork = config.public.tronNetwork as string;

watch(copied, (val) => {
  if (val) toast.add({ title: "地址已复制", color: "success" });
});

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

function copyAddress(address: string) {
  if (!address) return;
  copy(address).catch(() => {
    toast.add({ title: "复制失败", color: "error" });
  });
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
          <div v-if="detailUser.depositAddress" class="flex items-center gap-2">
            <span class="break-all text-xs font-mono">{{ detailUser.depositAddress }}</span>
            <UButton
              icon="i-lucide-copy"
              variant="ghost"
              size="xs"
              title="复制地址"
              @click="copyAddress(detailUser.depositAddress)"
            />
            <UButton
              icon="i-lucide-external-link"
              variant="ghost"
              size="xs"
              title="在 TronScan 中查看"
              :to="
                tronNetwork === 'mainnet'
                  ? `https://tronscan.org/#/address/${detailUser.depositAddress}`
                  : `https://nile.tronscan.org/#/address/${detailUser.depositAddress}`
              "
              target="_blank"
            />
          </div>
          <span v-else class="break-all text-xs">未分配</span>

          <span class="text-muted-foreground">注册时间</span>
          <span>{{ formatDate(detailUser.createdAt) }}</span>
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
