import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'
import { sortByHebrew } from '../../../config/store/utils/sortByHebrew.util'

// Import types
import type { ISupplier } from '@supplier/types/ISupplier.types'

export const SuppliersStore = defineStore('suppliers', () => {
  // Suppliers store state management
  const {
    data: suppliers,
    loading,
    error,
    set,
    add,
    update,
    remove,
    get,
    setLoading,
    setError,
    reset,
  } = createEntityStore<ISupplier>(sortByHebrew((s) => s.name))

  // Reactive search input query
  const searchQuery = ref('')

  // Filtered suppliers list logic
  const filtered = computed(() => {
    if (!searchQuery.value) return suppliers.value
    return suppliers.value?.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  })

  return {
    suppliers,
    loading,
    error,
    searchQuery,
    filtered,
    set,
    add,
    update,
    remove,
    get,
    setLoading,
    setError,
    reset,
  }
})
