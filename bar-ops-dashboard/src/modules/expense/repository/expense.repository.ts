import { BaseReceiptRepository } from '@shared/repository/base.repository'

import type { IExpense, ICreateExpense, IUpdateExpense } from '@expense/types/IExpense.types'
import type { IExpenseFilters, IExpenseRepository } from '@expense/types/IExpenseRepository.types'

class ExpenseRepository
  extends BaseReceiptRepository<IExpense, ICreateExpense, IUpdateExpense, IExpense, IExpenseFilters>
  implements IExpenseRepository
{
  constructor() {
    super('/expense', 'expenses', 'expense')
  }
}

const expenseRepository = new ExpenseRepository()

export default expenseRepository
