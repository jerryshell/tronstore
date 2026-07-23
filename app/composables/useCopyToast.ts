/**
 * Clipboard copy with automatic toast notification.
 * Replaces the common `copy + watch(copied) -> toast` pattern.
 */
export function useCopyToast() {
  const toast = useToast();
  const { copy, copied } = useClipboard();

  watch(copied, (val) => {
    if (val) toast.add({ title: "地址已复制", color: "success" });
  });

  return { copy, copied };
}
