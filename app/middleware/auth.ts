export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth();

  // Wait for initial auth check
  await new Promise<void>((resolve) => {
    if (!auth.loading.value) return resolve();
    const stop = watch(
      () => auth.loading.value,
      (v) => {
        if (!v) {
          stop();
          resolve();
        }
      },
    );
  });

  if (!auth.isLoggedIn.value) {
    return navigateTo("/login");
  }
});
