import { defineStore } from 'pinia'
import { ref } from 'vue'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'

import type { ISale } from '@sale/types/ISale.types'

export const SalesStore = defineStore('sales', () => {
  // Sales store state management
  const {
    data: sales,
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
  } = createEntityStore<ISale>()

  // Active sale filters
  const filters = ref<{
    clientId: string | null
    monthYear: string | null
    startDate: string | null
    endDate: string | null
  }>({
    clientId: null,
    monthYear: null,
    startDate: null,
    endDate: null,
  })

  // Update filter values function
  const setFilters = (_filters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ..._filters }
  }

  return {
    sales,
    loading,
    error,
    filters,
    setFilters,
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
