<script setup lang="ts">
definePageMeta({ layout: false });

const { auth, router, toast, email, password, loading, validate } = useAuthForm();

async function onSubmit() {
  if (!validate()) return;

  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push("/");
  } catch (error: any) {
    toast.add({ title: error.data?.message || "登录失败", color: "error" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/50 p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="text-center">
          <UIcon name="i-lucide-bitcoin" class="size-10 text-primary mx-auto" />
          <h1 class="text-xl font-semibold mt-2">TronStore</h1>
          <p class="text-sm text-muted-foreground">登录您的账户</p>
        </div>
      </template>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <UFormField label="邮箱">
          <UInput
            v-model="email"
            type="email"
            placeholder="admin@tronstore.com"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>

        <UFormField label="密码">
          <UInput
            v-model="password"
            type="password"
            placeholder="至少 8 位"
            autocomplete="current-password"
            class="w-full"
          />
        </UFormField>

        <UButton type="submit" block :loading="loading">登录</UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-muted-foreground">
          还没有账号？
          <ULink to="/register" class="text-primary">立即注册</ULink>
        </p>
      </template>
    </UCard>
  </div>
</template>
