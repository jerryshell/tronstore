<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

defineProps<{
  collapsed?: boolean;
}>();

const auth = useAuth();
const colorMode = useColorMode();

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: "label",
      label: auth.user?.value?.email || "",
    },
  ],
  [
    {
      label: "外观",
      icon: "i-lucide-sun-moon",
      children: [
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
      ],
    },
  ],
  [
    {
      label: "退出登录",
      icon: "i-lucide-log-out",
      onSelect: () => auth.logout(),
    },
  ],
]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :label="collapsed ? undefined : auth.user?.value?.email"
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
