<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/50 p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="text-center">
          <UIcon name="i-lucide-bitcoin" class="size-10 text-primary mx-auto" />
          <h1 class="text-xl font-semibold mt-2">TronStore</h1>
          <p class="text-sm text-muted-foreground">{{ subtitle }}</p>
        </div>
      </template>

      <slot />

      <template #footer>
        <slot name="footer" />
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  subtitle: string;
}>();
</script>
