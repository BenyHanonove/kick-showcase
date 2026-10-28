import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'
import { sortByHebrew } from '../../../config/store/utils/sortByHebrew.util'

import type { IClient } from '@client/types/IClient.types'

export const ClientsStore = defineStore('clients', () => {
  // Client store state management
  const {
    data: clients,
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
  } = createEntityStore<IClient>(sortByHebrew((c) => c.name))

  const searchQuery = ref('')

  // Filtered clients list logic
  const filtered = computed(() => {
    if (!searchQuery.value) return clients.value
    const query = searchQuery.value.toLowerCase()
    return clients.value?.filter(
      (c) => c.name.toLowerCase().includes(query) || c.brand.toLowerCase().includes(query),
    )
  })

  return {
    clients,
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
