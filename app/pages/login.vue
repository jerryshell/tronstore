<script setup lang="ts">
definePageMeta({ layout: false });

const { email, password, loading, submit } = useAuthForm();
const onSubmit = () => submit("login");
</script>

<template>
  <AuthCard subtitle="登录您的账户">
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
  </AuthCard>
</template>
