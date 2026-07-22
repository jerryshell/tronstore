<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

defineProps<{
  collapsed?: boolean;
}>();

const auth = useAuth();
const colorMode = useColorMode();

const appearanceItems: DropdownMenuItem[] = [
  {
    label: "浅色",
    icon: "i-lucide-sun",
    type: "checkbox",
    checked: colorMode.value === "light",
    onSelect(e: Event) {
      e.preventDefault();
      colorMode.preference = "light";
    },
  },
  {
    label: "深色",
    icon: "i-lucide-moon",
    type: "checkbox",
    checked: colorMode.value === "dark",
    onUpdateChecked(checked: boolean) {
      if (checked) colorMode.preference = "dark";
    },
    onSelect(e: Event) {
      e.preventDefault();
    },
  },
];

const items = computed<DropdownMenuItem[][]>(() => {
  const groups: DropdownMenuItem[][] = [];

  // 标签组
  groups.push([
    {
      type: "label",
      label: auth.isLoggedIn.value ? auth.user?.value?.email || "" : "未登录",
    },
  ]);

  // 外观设置组
  groups.push([
    {
      label: "外观",
      icon: "i-lucide-sun-moon",
      children: appearanceItems,
    },
  ]);

  // 操作组（根据登录状态显示不同内容）
  if (auth.isLoggedIn.value) {
    groups.push([
      {
        label: "退出登录",
        icon: "i-lucide-log-out",
        onSelect: () => auth.logout(),
      },
    ]);
  } else {
    groups.push([
      {
        label: "登录",
        icon: "i-lucide-log-in",
        to: "/login",
      },
      {
        label: "注册",
        icon: "i-lucide-user-plus",
        to: "/register",
      },
    ]);
  }

  return groups;
});
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :label="collapsed ? undefined : auth.isLoggedIn.value ? auth.user?.value?.email : '未登录'"
      icon="i-lucide-circle-user"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      trailing-icon="i-lucide-chevrons-up-down"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
  </UDropdownMenu>
</template>
