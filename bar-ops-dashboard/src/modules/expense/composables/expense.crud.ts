import { rules } from '@shared/utils/rules.util'

import { SessionStore } from '@stores'

import { expenseProvider } from '@expense/providers/expense.provider'

import { useCrud, useReceipt } from '@shared/composables/crud.composable'

import { ExpensePaidBy, ExpensePaidByLabels } from '@expense/types/PaidBy.types'
import type { IExpense, ICreateExpense, IUpdateExpense } from '@expense/types/IExpense.types'
import type { IFormField } from '@shared/types/IForm.types'

// Export expense crud composable
export const useExpenseCrud = () => {
  const store = SessionStore()
  const crud = useCrud<IExpense, ICreateExpense, IUpdateExpense>(expenseProvider, store.expenses)
  const receipt = useReceipt<IExpense>(expenseProvider, store.expenses)

  const expenseFields: IFormField[] = [
    {
      key: 'name',
      label: 'שם ההוצאה*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'amount',
      label: 'סכום*',
      type: 'number',
      props: { prefix: '₪' },
      rules: [rules.greaterThan(0, 'חובה וגדול מ-0')],
    },
    {
      key: 'paidBy',
      label: 'מקור תשלום*',
      type: 'select',
      items: Object.values(ExpensePaidBy).map((val) => ({
        title: ExpensePaidByLabels[val] || val,
        value: val,
      })),
      rules: [rules.required()],
    },
    {
      key: 'desc',
      label: 'תיאור (אופציונלי)',
      type: 'textarea',
    },
  ]

  const expenseInitialState = (sessionId: string): ICreateExpense => ({
    sessionId,
    name: '',
    amount: 0,
    desc: '',
    paidBy: ExpensePaidBy.HOUSE,
  })

  return {
    ...crud,
    ...receipt,
    expenseFields,
    expenseInitialState,
  }
}
