import { ExpensePaidBy, ExpensePaidByLabels } from './PaidBy.types'

export { ExpensePaidBy, ExpensePaidByLabels }

export interface ICreateExpense {
  sessionId: string
  name: string
  amount: number
  desc?: string
  paidBy?: ExpensePaidBy
  invoice?: boolean
  vat?: boolean
  receiptKey?: string
}

export interface IUpdateExpense {
  id: string
  timestamp: string
  name?: string
  amount?: number
  desc?: string
  paidBy?: ExpensePaidBy
  invoice?: boolean
  vat?: boolean
  receiptKey?: string
}

export interface IExpense extends ICreateExpense {
  id: string
  timestamp: string
  receiptUrl?: string
}
