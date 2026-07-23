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

  return {
    auth,
    router,
    toast,
    email,
    password,
    loading,
    validate,
  };
}
