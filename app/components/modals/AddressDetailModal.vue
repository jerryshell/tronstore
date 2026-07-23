<script setup lang="ts">
const { formatDate } = useTimezone();
const config = useRuntimeConfig();
const network = config.public.tronNetwork as string;

const props = defineProps<{
  address: string;
}>();

const open = defineModel<boolean>("open", { required: true });

const activeTab = ref("0");
const loadingBalance = ref(false);
const loadingTransactions = ref(false);
const balanceData = ref<any>(null);
const transactions = ref<any[]>([]);
const fingerprint = ref<string | null>(null);
const hasMore = ref(false);

const tabs = [
  { label: "余额", slot: "balance" },
  { label: "转账明细", slot: "transactions" },
];

async function fetchBalance() {
  if (!props.address) return;
  loadingBalance.value = true;
  try {
    balanceData.value = await $fetch("/api/admin/address-balance", {
      query: { address: props.address },
    });
  } catch (error: any) {
    console.error("查询余额失败:", error);
  } finally {
    loadingBalance.value = false;
  }
}

async function fetchTransactions(append = false) {
  if (!props.address) return;
  loadingTransactions.value = true;
  try {
    const query: any = { address: props.address, limit: 20 };
    if (append && fingerprint.value) {
      query.fingerprint = fingerprint.value;
    }

    const data = await $fetch<any>("/api/admin/address-transactions", { query });

    if (append) {
      transactions.value = [...transactions.value, ...data.transactions];
    } else {
      transactions.value = data.transactions;
    }

    fingerprint.value = data.fingerprint;
    hasMore.value = !!data.fingerprint;
  } catch (error: any) {
    console.error("查询交易记录失败:", error);
  } finally {
    loadingTransactions.value = false;
  }
}

function onTabChange(tab: string | number) {
  if (String(tab) === "0" && !balanceData.value) {
    fetchBalance();
  } else if (String(tab) === "1" && transactions.value.length === 0) {
    fetchTransactions();
  }
}

function loadMore() {
  fetchTransactions(true);
}

watch(
  () => props.address,
  (newAddress) => {
    if (newAddress) {
      balanceData.value = null;
      transactions.value = [];
      fingerprint.value = null;
      hasMore.value = false;
      activeTab.value = "0";
      fetchBalance();
    }
  },
);

watch(open, (isOpen) => {
  if (isOpen && props.address) {
    balanceData.value = null;
    transactions.value = [];
    fingerprint.value = null;
    hasMore.value = false;
    activeTab.value = "0";
    fetchBalance();
  }
});

function formatValue(value: string, decimals = 6) {
  const num = parseFloat(value) / Math.pow(10, decimals);
  return num.toFixed(decimals);
}

function formatTime(timestamp: number) {
  return formatDate(new Date(timestamp));
}
</script>

<template>
  <UModal v-model:open="open" title="链上数据" :ui="{ content: 'max-w-4xl' }">
    <template #body>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-sm">地址：</span>
          <span class="font-mono text-sm break-all">{{ address }}</span>
        </div>

        <UTabs :items="tabs" v-model="activeTab" @update:model-value="onTabChange">
          <!-- 余额 Tab -->
          <template #balance>
            <div class="mt-4">
              <div v-if="loadingBalance" class="space-y-2">
                <USkeleton v-for="i in 3" :key="i" class="h-12 w-full" />
              </div>
              <div v-else-if="balanceData" class="space-y-4">
                <UCard>
                  <template #header>
                    <h3 class="text-lg font-semibold">账户余额</h3>
                  </template>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <div class="text-sm text-muted-foreground">TRX 余额</div>
                      <div class="text-2xl font-bold">{{ balanceData.trx?.trx || "0" }} TRX</div>
                    </div>
                    <div class="space-y-2">
                      <div class="text-sm text-muted-foreground">USDT 余额</div>
                      <div class="text-2xl font-bold">{{ balanceData.usdt?.usdt || "0" }} USDT</div>
                    </div>
                  </div>
                </UCard>
                <div class="text-xs text-muted-foreground">
                  网络：{{ balanceData.network === "mainnet" ? "主网" : "测试网 (Nile)" }}
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">暂无数据</div>
            </div>
          </template>

          <!-- 转账明细 Tab -->
          <template #transactions>
            <div class="mt-4">
              <div v-if="loadingTransactions && transactions.length === 0" class="space-y-2">
                <USkeleton v-for="i in 5" :key="i" class="h-12 w-full" />
              </div>
              <div v-else-if="transactions.length > 0" class="space-y-4">
                <UTable
                  :data="transactions"
                  :columns="[
                    {
                      accessorKey: 'type',
                      header: '类型',
                      cell: ({ row }: any) => {
                        const isReceive = row.original.to?.toLowerCase() === address?.toLowerCase();
                        return isReceive ? '接收' : '发送';
                      },
                    },
                    {
                      accessorKey: 'amount',
                      header: '金额',
                      cell: ({ row }: any) => formatValue(row.original.value) + ' USDT',
                    },
                    {
                      accessorKey: 'from',
                      header: '发送方',
                      cell: ({ row }: any) => {
                        const addr = row.original.from;
                        return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '-';
                      },
                    },
                    {
                      accessorKey: 'to',
                      header: '接收方',
                      cell: ({ row }: any) => {
                        const addr = row.original.to;
                        return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '-';
                      },
                    },
                    {
                      accessorKey: 'blockTimestamp',
                      header: '时间',
                      cell: ({ row }: any) => formatTime(row.original.blockTimestamp),
                    },
                    { id: 'actions', header: '操作' },
                  ]"
                >
                  <template #actions-cell="{ row }">
                    <UButton
                      size="xs"
                      variant="outline"
                      icon="i-lucide-external-link"
                      :to="`https://${network === 'mainnet' ? '' : 'nile.'}tronscan.org/#/transaction/${row.original.txId}`"
                      target="_blank"
                    >
                      查看
                    </UButton>
                  </template>
                </UTable>

                <div v-if="hasMore" class="text-center">
                  <UButton variant="outline" :loading="loadingTransactions" @click="loadMore">
                    加载更多
                  </UButton>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">暂无交易记录</div>
            </div>
          </template>
        </UTabs>
      </div>
    </template>
  </UModal>
</template>
