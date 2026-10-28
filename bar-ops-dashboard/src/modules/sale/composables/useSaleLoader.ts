import { ref } from 'vue'

import { consumeProvider } from '@consume/providers/consume.provider'
import { saleProvider } from '@sale/providers/sale.provider'
import { clientProvider } from '@client/providers/client.provider'

import { SaleStore, ClientsStore } from '@stores'

export const useSaleLoader = () => {
  const saleStore = SaleStore()
  const clientsStore = ClientsStore()
  const isInitialLoading = ref(false)

  const loadFullSale = async (saleId: string, clientId: string) => {
    const isDifferentSale = saleStore.sale?.id !== saleId
    const isStoreEmpty =
      !saleStore.sale || !saleStore.consumes.data || saleStore.consumes.data.length === 0
    if (isDifferentSale || isStoreEmpty) {
      isInitialLoading.value = true
    }

    try {
      const [saleRes, consumesRes, clientsRes] = await Promise.all([
        saleProvider.get(saleId),
        consumeProvider.list({ sessionId: saleId }), // Consumes db filters by sessionId
        clientsStore.clients?.length ? null : clientProvider.list([]),
      ])

      void clientId

      if (clientsRes?.success && clientsRes.data) {
        clientsStore.set(clientsRes.data)
      }

      if (saleRes.success && saleRes.data) {
        saleStore.setSale(saleRes.data)
      }

      saleStore.consumes.set(consumesRes.success && consumesRes.data ? consumesRes.data : [])
    } finally {
      isInitialLoading.value = false
    }
  }

  return {
    loadFullSale,
    isInitialLoading,
  }
}
