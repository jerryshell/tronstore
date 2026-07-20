import type { User } from "~~/shared/types";

export function useAuth() {
  const router = useRouter();

  const user = useState<User | null>("auth:user", () => null);
  const loading = useState<boolean>("auth:loading", () => true);

  async function fetchUser() {
    loading.value = true;
    try {
      const headers = useRequestHeaders(["cookie"]);
      const data = await $fetch("/api/me", { headers }).catch(() => null);
      user.value = data as User | null;
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    const data = await $fetch("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    user.value = data as User;
    return data;
  }

  async function register(email: string, password: string) {
    const data = await $fetch("/api/auth/register", {
      method: "POST",
      body: { email, password },
    });
    user.value = data as User;
    return data;
  }

  async function logout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    router.push("/login");
  }

  async function refresh() {
    await fetchUser();
  }

  const isAdmin = computed(() => user.value?.role === "admin");
  const isLoggedIn = computed(() => !!user.value);

  // Fetch on first call (only if not already loaded)
  if (loading.value && !user.value) {
    fetchUser();
  }

  return {
    user: computed(() => user.value),
    loading: computed(() => loading.value),
    isAdmin,
    isLoggedIn,
    login,
    register,
    logout,
    refresh,
    fetchUser,
  };
}
