<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">基本信息</h2>
    </template>
    <dl class="space-y-2">
      <div class="flex justify-between">
        <span class="text-muted-foreground">邮箱</span><span>{{ user.email }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">角色</span><span>{{ user.role }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">余额</span>
        <span>{{ (user.balance / 1_000_000).toFixed(6) }} USDT</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">费率</span
        ><span>{{ user.effectiveFeeRateBps }} bps</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">充值地址</span>
        <div v-if="user.depositAddress" class="flex items-center gap-2">
          <span class="font-mono text-sm">{{ user.depositAddress }}</span>
          <UButton
            icon="i-lucide-copy"
            variant="ghost"
            size="xs"
            title="复制地址"
            @click="$emit('copy', user.depositAddress)"
          />
          <UButton
            icon="i-lucide-external-link"
            variant="ghost"
            size="xs"
            title="在 TronScan 中查看"
            :to="tronscanUrl"
            target="_blank"
          />
        </div>
        <span v-else class="font-mono text-sm">未分配</span>
      </div>
    </dl>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  user: any;
}>();

defineEmits<{
  copy: [address: string];
}>();

const tronscanUrl = computed(() => tronscanAddressUrl(props.user.depositAddress));
</script>
