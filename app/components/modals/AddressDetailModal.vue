<script setup lang="ts">
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

function resetState() {
  balanceData.value = null;
  transactions.value = [];
  fingerprint.value = null;
  hasMore.value = false;
  activeTab.value = "0";
}

watch(
  () => props.address,
  (newAddress) => {
    if (newAddress) {
      resetState();
      fetchBalance();
    }
  },
);

watch(open, (isOpen) => {
  if (isOpen && props.address) {
    resetState();
    fetchBalance();
  }
});
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
          <template #balance>
            <AddressBalanceCard :loading="loadingBalance" :data="balanceData" />
          </template>

          <template #transactions>
            <AddressTransactionsTable
              :loading="loadingTransactions"
              :transactions="transactions"
              :address="address"
              :has-more="hasMore"
              @load-more="loadMore"
            />
          </template>
        </UTabs>
      </div>
    </template>
  </UModal>
</template>
