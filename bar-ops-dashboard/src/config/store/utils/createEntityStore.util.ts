import { ref, type Ref } from 'vue'

export const createEntityStore = <T extends { id: string }>(sort?: (a: T, b: T) => number) => {
  const data = ref<T[] | null>(null) as Ref<T[] | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Replace list, apply sort
  const set = (items: T[] | null) => {
    if (!items) {
      data.value = null
      return
    }

    data.value = sort ? [...items].sort(sort) : items
  }

  // Add or update item
  const add = (item: T) => {
    if (data.value) {
      const existingIndex = data.value.findIndex((i) => i.id === item.id)
      if (existingIndex !== -1) {
        // Update existing item
        const newList = [...data.value]
        newList[existingIndex] = { ...newList[existingIndex], ...item }
        set(newList)
      } else {
        // Append new item
        set([...data.value, item])
      }
    } else {
      set([item])
    }
  }

  // Merge by id
  const update = (updated: T) => {
    if (!data.value) return
    const index = data.value.findIndex((i) => i.id === updated.id)
    if (index === -1) return
    const newList = [...data.value]
    newList[index] = { ...newList[index], ...updated }
    set(newList)
  }

  // Filter out by id
  const remove = (id: string) => {
    if (data.value) {
      data.value = data.value.filter((i) => i.id !== id)
    }
  }

  // Get item by id
  const get = (id: string) => {
    return data.value?.find((i) => i.id === id) ?? null
  }

  // Loading state setter
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  // Error state setter
  const setError = (err: Error | null) => {
    error.value = err
  }

  // Reset all state
  const reset = () => {
    data.value = null
    loading.value = false
    error.value = null
  }

  return { data, loading, error, set, add, update, remove, get, setLoading, setError, reset }
}
