import { defineStore } from 'pinia'
import { ref } from 'vue'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'

import type { IMission } from '@missions/types/IMission.types'

export const MissionsStore = defineStore('missions', () => {
  const {
    data: missions,
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
  } = createEntityStore<IMission>((a, b) => b.monthYear.localeCompare(a.monthYear))

  const filters = ref<{ monthYear: string | null }>({
    monthYear: null,
  })

  const setFilters = (_filters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ..._filters }
  }

  return {
    missions,
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
