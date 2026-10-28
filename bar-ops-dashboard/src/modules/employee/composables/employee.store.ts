import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'
import { sortByHebrew } from '../../../config/store/utils/sortByHebrew.util'

// Import types
import type { IEmployee } from '@employee/types/IEmployee.types'

export const EmployeesStore = defineStore('employees', () => {
  // Employees store state management
  const {
    data: employees,
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
  } = createEntityStore<IEmployee>(sortByHebrew((e) => `${e.firstName} ${e.lastName}`))

  // Reactive search input query
  const searchQuery = ref('')

  // Filtered employees list logic
  const filtered = computed(() => {
    if (!searchQuery.value) return employees.value
    const query = searchQuery.value.toLowerCase()
    return employees.value?.filter((e) => {
      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase()
      return fullName.includes(query)
    })
  })

  return {
    employees,
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
