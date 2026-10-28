import { defineStore } from 'pinia'
import { ref } from 'vue'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'

import type { ISession } from '@session/types/ISession.types'

export const SessionsStore = defineStore('sessions', () => {
  // Sessions store state management
  const {
    data: sessions,
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
  } = createEntityStore<ISession>()

  // Active session filters
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
    sessions,
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
