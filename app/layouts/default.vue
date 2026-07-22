<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const auth = useAuth();
const open = ref(false);

const guestLinks = computed(() => [
  {
    label: "商品",
    icon: "i-lucide-shopping-bag",
    to: "/products",
    onSelect: () => {
      open.value = false;
    },
  },
]);

const userLinks = computed(() => [
  {
    label: "首页",
    icon: "i-lucide-house",
    to: "/",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "充值",
    icon: "i-lucide-wallet",
    to: "/deposit",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "充值记录",
    icon: "i-lucide-list",
    to: "/deposits",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "我的钱包",
    icon: "i-lucide-credit-card",
    to: "/wallet",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "商品",
    icon: "i-lucide-shopping-bag",
    to: "/products",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "订单",
    icon: "i-lucide-receipt",
    to: "/orders",
    onSelect: () => {
      open.value = false;
    },
  },
]);

const adminLinks = computed(() => [
  {
    label: "用户管理",
    icon: "i-lucide-users",
    to: "/admin/users",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "商品管理",
    icon: "i-lucide-package",
    to: "/admin/products",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "订单管理",
    icon: "i-lucide-receipt",
    to: "/admin/orders",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "归集任务",
    icon: "i-lucide-arrow-left-right",
    to: "/admin/sweeps",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "系统设置",
    icon: "i-lucide-settings",
    to: "/settings",
    onSelect: () => {
      open.value = false;
    },
  },
]);

const mainLinks = computed(() => {
  if (!auth.isLoggedIn.value) return guestLinks.value;
  if (auth.isAdmin.value) return userLinks.value;
  return userLinks.value;
});

const subLinks = computed(() => {
  if (!auth.isLoggedIn.value) return null;
  if (auth.isAdmin.value) return adminLinks.value;
  return null;
});

const groups = computed(() => [
  {
    id: "links",
    label: "导航",
    items: [...mainLinks.value, ...(subLinks.value || [])],
  },
]);
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-2 py-3">
          <UIcon name="i-lucide-bitcoin" class="size-6 text-primary" />
          <span v-if="!collapsed" class="font-semibold text-lg">TronStore</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="mainLinks"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          v-if="subLinks"
          :collapsed="collapsed"
          :items="subLinks"
          orientation="vertical"
          tooltip
          popover
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
