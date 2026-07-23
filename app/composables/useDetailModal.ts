import type { Ref } from "vue";

/**
 * Shared open/item state for detail modals.
 */
export function useDetailModal<T = any>() {
  const open = ref(false);
  const item = ref(null) as Ref<T | null>;

  function show(value: T) {
    item.value = value;
    open.value = true;
  }

  return { open, item, show };
}
