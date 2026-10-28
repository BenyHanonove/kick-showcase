import expenseRepository from '@expense/repository/expense.repository'

import { BaseReceiptProvider } from '@shared/providers/base.provider'

import type { IExpense, ICreateExpense, IUpdateExpense } from '@expense/types/IExpense.types'
import type { IExpenseFilters } from '@expense/types/IExpenseRepository.types'

class ExpenseProvider extends BaseReceiptProvider<
  IExpense,
  ICreateExpense,
  IUpdateExpense,
  IExpense,
  IExpenseFilters,
  {
    file: string
    sessionId: string
    id: string
    filename?: string
  },
  typeof expenseRepository
> {}

export const expenseProvider = new ExpenseProvider(expenseRepository)
