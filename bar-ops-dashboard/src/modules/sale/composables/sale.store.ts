import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'

import type { ISale } from '@sale/types/ISale.types'
import type { IConsume } from '@consume/types/IConsume.types'

export const SaleStore = defineStore(
  'sale',
  () => {
    const sale = shallowRef<ISale | null>(null)

    const setSale = (data: ISale) => {
      sale.value = data
    }

    const consumes = createEntityStore<IConsume>()

    const reset = () => {
      sale.value = null
      consumes.reset()
    }

    return {
      sale,
      setSale,
      consumes,
      reset,
    }
  },
  {
    persist: {
      pick: ['sale', 'consumes.data'],
    },
  },
)
