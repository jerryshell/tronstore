export function useAuthForm() {
  const auth = useAuth();
  const router = useRouter();
  const toast = useToast();

  const email = ref("");
  const password = ref("");
  const loading = ref(false);

  function validate(): boolean {
    if (password.value.length < 8) {
      toast.add({ title: "密码至少 8 位", color: "error" });
      return false;
    }
    return true;
  }

  async function submit(action: "login" | "register") {
    if (!validate()) return;

    loading.value = true;
    try {
      await auth[action](email.value, password.value);
      router.push("/");
    } catch (error: any) {
      const fallback = action === "login" ? "登录失败" : "注册失败";
      toast.add({ title: error.data?.message || fallback, color: "error" });
    } finally {
      loading.value = false;
    }
  }

  return {
    email,
    password,
    loading,
    validate,
    submit,
  };
}
