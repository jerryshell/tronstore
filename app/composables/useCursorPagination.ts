import type { Ref } from "vue";

interface PagedResponse<T> {
  items?: T[];
  cursor: string | null;
}

/**
 * Shared state + fetching for cursor-paginated list pages.
 */
export function useCursorPagination<T = any>(endpoint: string, limit = 50) {
  const items = ref([]) as Ref<T[]>;
  const cursor = ref<string | null>(null);
  const loading = ref(true);
  const hasMore = ref(false);

  async function fetch(append = false) {
    loading.value = true;
    try {
      const query: Record<string, unknown> = { limit };
      if (append && cursor.value) query.cursor = cursor.value;
      const data = await $fetch<PagedResponse<T>>(endpoint, { query });
      const page = data.items || [];
      items.value = append ? [...items.value, ...page] : page;
      cursor.value = data.cursor;
      hasMore.value = !!data.cursor;
    } catch {
      // keep previous state on error
    } finally {
      loading.value = false;
    }
  }

  function loadMore() {
    fetch(true);
  }

  return { items, cursor, loading, hasMore, fetch, loadMore };
}
