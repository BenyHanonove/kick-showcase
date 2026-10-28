import { defineStore } from 'pinia'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'
import { sortByHebrew } from '../../../config/store/utils/sortByHebrew.util'

import type { IProduct } from '@product/types/IProduct.types'

export const ProductsStore = defineStore(
  'products',
  () => {
    // Products store state management
    const {
      data: products,
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
    } = createEntityStore<IProduct>(sortByHebrew((p) => p.name || ''))

    return { products, loading, error, set, add, update, remove, get, setLoading, setError, reset }
  },
  {
    persist: {
      pick: ['products'],
    },
  },
)
