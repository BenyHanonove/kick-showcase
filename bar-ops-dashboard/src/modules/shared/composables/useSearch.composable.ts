import { computed, ref, type Ref } from 'vue'

/**
 * Modular client-side search.
 *
 * Pass the list to search (e.g. a store ref) and the keys to match against.
 * Returns a `query` ref to bind to an input and a reactive `results` list.
 *
 * @example
 * const { query, results } = useSearch(suppliers, ['name'])
 */
export function useSearch<T extends object>(
  items: Ref<T[] | null | undefined>,
  searchKeys: (keyof T)[],
) {
  const query = ref<string>('')

  const results = computed(() => {
    const list = items.value ?? []
    const q = (query.value ?? '').trim().toLowerCase()
    if (!q) return list
    return list.filter((item) => {
      if (!item) return false
      return searchKeys.some((key) =>
        String(item[key] ?? '')
          .toLowerCase()
          .includes(q),
      )
    })
  })

  return { query, results }
}
