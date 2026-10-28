import { rules } from '@shared/utils/rules.util'

import { SessionStore, SnackbarStore } from '@stores'

import { cashierProvider } from '@cashier/providers/cashier.provider'

import { useCrud, useReceipt } from '@shared/composables/crud.composable'

import { CashierLocation, CashierLocationLabels } from '@cashier/types/CashierLocation.types'
import type { ICashier, ICreateCashier, IUpdateCashier } from '@cashier/types/ICashier.types'
import type { IFormField, ISelectItem } from '@shared/types/IForm.types'

// Export cashier crud composable
export const useCashierCrud = () => {
  const store = SessionStore()
  const crud = useCrud<ICashier, ICreateCashier, IUpdateCashier>(cashierProvider, store.cashiers)
  const receipt = useReceipt<ICashier>(cashierProvider, store.cashiers)

  const handleCreate = async (formData: ICreateCashier, quantity: number = 1) => {
    crud.isCreating.value = true
    const snackbarStore = SnackbarStore()
    try {
      if (quantity > 1) {
        // Create multiple cashiers in parallel using Promise.all
        const promises = Array.from({ length: quantity }, () => cashierProvider.create(formData))
        const results = await Promise.all(promises)

        let successCount = 0

        for (const result of results) {
          if (result.success && result.data) {
            store.cashiers.add(result.data)
            successCount++
          }
        }

        if (successCount > 0) {
          snackbarStore.open(`נוצרו בהצלחה ${successCount} קופות`, 'success')
          crud.createDialogOpen.value = false
        } else {
          snackbarStore.open('יצירת הקופות נכשלה', 'error')
        }
      } else {
        // Default single creation
        await crud.handleCreate(formData)
      }
    } catch (error) {
      let message = 'ארעה שגיאה בלתי צפויה'
      if (error instanceof Error) message = error.message
      snackbarStore.open(message, 'error')
    } finally {
      crud.isCreating.value = false
    }
  }

  const cashierFields: IFormField[] = [
    {
      key: 'location',
      label: 'מיקום*',
      type: 'select',
      items: Object.values(CashierLocation).map(
        (val): ISelectItem => ({
          title: CashierLocationLabels[val] || val,
          value: val,
        }),
      ),
      rules: [rules.required()],
    },
    {
      key: 'cash',
      label: 'מזומן*',
      type: 'number',
      cols: 4,
      props: { prefix: '₪' },
      rules: [rules.minNumber(0)],
    },
    {
      key: 'credit',
      label: 'אשראי*',
      type: 'number',
      cols: 4,
      props: { prefix: '₪' },
      rules: [rules.minNumber(0)],
    },
    {
      key: 'creditTip',
      label: 'טיפ*',
      type: 'number',
      cols: 4,
      props: { prefix: '₪' },
      rules: [rules.minNumber(0)],
    },
  ]

  const cashierInitialState = (sessionId: string): ICreateCashier => ({
    sessionId,
    cash: 0,
    credit: 0,
    creditTip: 0,
    location: CashierLocation.BAR,
  })

  const cashierUpdateFields: IFormField[] = [
    ...cashierFields,
    {
      key: 'serial',
      label: 'מספר סידורי',
      type: 'text',
      cols: 12,
    },
  ]

  return {
    ...crud,
    ...receipt,
    handleCreate,
    cashierFields,
    cashierUpdateFields,
    cashierInitialState,
  }
}
