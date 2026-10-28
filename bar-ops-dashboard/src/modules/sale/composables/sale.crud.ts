import { computed, isRef } from 'vue'

import { rules } from '@shared/utils/rules.util'

import { SnackbarStore, SaleStore, ClientsStore } from '@stores'

import { useCrud, useSummaryDownloader } from '@shared/composables/crud.composable'

import { saleProvider } from '@sale/providers/sale.provider'

import type { ICrudStore } from '@shared/types/ICrud.types'
import type { ISale, ICreateSale, IUpdateSale } from '@sale/types/ISale.types'
import type { ISaleFilters } from '@sale/types/ISaleRepository.types'
import type { IFormField } from '@shared/types/IForm.types'

// Define store interface for sale CRUD actions
interface ISaleCrudStore extends ICrudStore<ISale> {
  set(items: ISale[]): void
  setLoading(loading: boolean): void
  sales?: import('vue').Ref<ISale[] | null> | ISale[] | null
}

// Export sale crud composable
export function useSaleCrud(store: ISaleCrudStore) {
  const snackbarStore = SnackbarStore()
  const saleStore = SaleStore()
  const clientsStore = ClientsStore()

  const base = useCrud<ISale, ICreateSale, IUpdateSale>(saleProvider, store)

  // Initialize summary download actions
  const { isSummarizing, handleSummary } = useSummaryDownloader(
    saleProvider.summary.bind(saleProvider),
  )

  // GenericForm configuration ------------------------------------------------
  const saleInitialState: ICreateSale = {
    clientId: '',
    datetime: new Date().toISOString().split('T')[0] || '',
    name: '',
  }

  const saleFields = computed<IFormField[]>(() => [
    {
      key: 'name',
      label: 'שם המכירה*',
      type: 'text',
      rules: [rules.required('חובה להזין שם מכירה')],
    },
    {
      key: 'clientId',
      label: 'בחר לקוח*',
      type: 'select',
      items: (clientsStore.clients || []).map((c) => ({ title: c.brand, value: c.id })),
      props: { loading: clientsStore.loading },
      rules: [rules.required('חובה לבחור לקוח')],
    },
    {
      key: 'datetime',
      label: 'תאריך*',
      type: 'date',
      rules: [rules.required('חובה להזין תאריך')],
    },
    {
      key: 'paid',
      label: 'שולם',
      type: 'circle-toggle',
      hidden: !base.selectedItem.value,
    },
  ])

  // Normalise datetime to YYYY-MM-DD for the date input
  const saleUpdateInitial = computed<IUpdateSale>(() => {
    const sale = base.selectedItem.value
    if (!sale) return { id: '', timestamp: '', clientId: '', datetime: '', name: '', paid: false }
    return {
      id: sale.id,
      timestamp: sale.timestamp,
      clientId: sale.clientId,
      name: sale.name,
      paid: sale.paid,
      datetime: sale.datetime ? sale.datetime.split('T')[0] || '' : '',
    }
  })

  // Convert date-only input back to full ISO8601 string
  const handleCreate = (formData: ICreateSale) =>
    base.handleCreate({ ...formData, datetime: new Date(formData.datetime).toISOString() })

  // Fetch sales list from provider
  const fetchSales = async (filters?: ISaleFilters) => {
    store.setLoading(true)
    const result = await saleProvider.list(filters)
    if (result.success && result.data) {
      store.set(result.data)
    } else {
      snackbarStore.open(result.message, 'error')
    }
    store.setLoading(false)
  }

  // Wrap handleUpdate to sync matching sale into SaleStore
  const originalHandleUpdate = base.handleUpdate
  const handleUpdate = async (formData: IUpdateSale) => {
    const payload: IUpdateSale = {
      ...formData,
      ...(formData.datetime ? { datetime: new Date(formData.datetime).toISOString() } : {}),
    }
    const selectedId = base.selectedItem.value?.id
    await originalHandleUpdate(payload)
    if (selectedId && !base.selectedItem.value && saleStore.sale?.id === selectedId) {
      const salesProp = store.sales
      let salesArray: ISale[] | undefined = undefined

      if (Array.isArray(salesProp)) {
        salesArray = salesProp
      } else if (isRef(salesProp) && Array.isArray(salesProp.value)) {
        salesArray = salesProp.value
      }

      if (salesArray) {
        const updated = salesArray.find((s) => s.id === selectedId)
        if (updated) {
          saleStore.setSale(updated)
        }
      } else {
        const nextSale = {
          ...saleStore.sale,
          ...payload,
        } as ISale
        saleStore.setSale(nextSale)
      }
    }
  }

  return {
    ...base,
    handleCreate,
    handleUpdate,
    isSummarizing,
    handleSummary,
    fetchSales,
    saleFields,
    saleInitialState,
    saleUpdateInitial,
  }
}
