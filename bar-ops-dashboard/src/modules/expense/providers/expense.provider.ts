// Import repository
import expenseRepository from '@expense/repository/expense.repository'

// Import base provider
import { BaseReceiptProvider } from '@shared/providers/base.provider'

// Import types
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

// Extend base provider
export const expenseProvider = new ExpenseProvider(expenseRepository)
