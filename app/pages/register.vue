<script setup lang="ts">
definePageMeta({ layout: false });

const { email, password, loading, submit } = useAuthForm();
const onSubmit = () => submit("register");
</script>

<template>
  <AuthCard subtitle="创建新账户">
    <form @submit.prevent="onSubmit" class="space-y-4">
      <UFormField label="邮箱">
        <UInput
          v-model="email"
          type="email"
          placeholder="user@tronstore.com"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>

      <UFormField label="密码">
        <UInput
          v-model="password"
          type="password"
          placeholder="至少 8 位"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>

      <UButton type="submit" block :loading="loading">注册</UButton>
    </form>

    <template #footer>
      <p class="text-center text-sm text-muted-foreground">
        已有账号？
        <ULink to="/login" class="text-primary">立即登录</ULink>
      </p>
    </template>
  </AuthCard>
</template>
