import { ref } from 'vue'

import { rules } from '@shared/utils/rules.util'

import { SnackbarStore, SuppliersStore } from '@stores'

import { useCrud } from '@shared/composables/crud.composable'

import { supplierProvider } from '@supplier/providers/supplier.provider'

import type { ISupplier, ICreateSupplier, IUpdateSupplier } from '@supplier/types/ISupplier.types'
import type { IFormField } from '@shared/types/IForm.types'

// Export supplier crud composable
export function useSupplierCrud() {
  const snackbarStore = SnackbarStore()
  const suppliersStore = SuppliersStore()

  const base = useCrud<ISupplier, ICreateSupplier, IUpdateSupplier>(
    supplierProvider,
    suppliersStore,
  )

  // Manage summary dialog states
  const summaryDialogOpen = ref(false)
  const summarySupplier = ref<ISupplier | null>(null)
  const isGeneratingSummary = ref(false)

  // Supplier form configuration
  const supplierFields: IFormField[] = [
    {
      key: 'name',
      label: 'שם הספק (חברה)*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'contactName',
      label: 'שם איש קשר*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'phone',
      label: 'מספר טלפון*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'address',
      label: 'כתובת*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'notes',
      label: 'הערות',
      type: 'textarea',
    },
  ]

  const supplierInitialState: ICreateSupplier = {
    name: '',
    contactName: '',
    phone: '',
    address: '',
    notes: '',
  }

  // Open summary dialog for a supplier
  const openSummary = (supplier: ISupplier) => {
    summarySupplier.value = supplier
    summaryDialogOpen.value = true
  }

  // Generate and download supplier summary report
  const handleSummary = async ({ id, monthYear }: { id: string; monthYear: string }) => {
    isGeneratingSummary.value = true
    try {
      const { blob, fileName } = await supplierProvider.summary(id, monthYear)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      snackbarStore.open('הסיכום הורד בהצלחה', 'success')
      summaryDialogOpen.value = false
    } catch {
      snackbarStore.open('שגיאה ביצירת הדוח', 'error')
    } finally {
      isGeneratingSummary.value = false
    }
  }

  return {
    ...base,
    summaryDialogOpen,
    summarySupplier,
    isGeneratingSummary,
    openSummary,
    handleSummary,
    supplierFields,
    supplierInitialState,
  }
}
