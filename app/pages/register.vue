<script setup lang="ts">
definePageMeta({ layout: false });

const auth = useAuth();
const router = useRouter();
const toast = useToast();

const email = ref("");
const password = ref("");
const loading = ref(false);

async function onSubmit() {
  if (password.value.length < 8) {
    toast.add({ title: "密码至少 8 位", color: "error" });
    return;
  }

  loading.value = true;
  try {
    await auth.register(email.value, password.value);
    router.push("/");
  } catch (error: any) {
    toast.add({ title: error.data?.message || "注册失败", color: "error" });
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
          <p class="text-sm text-muted-foreground">创建新账户</p>
        </div>
      </template>

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
    </UCard>
  </div>
</template>
