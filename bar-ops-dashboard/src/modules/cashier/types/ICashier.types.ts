import { CashierLocation } from '@cashier/types/CashierLocation.types'

export interface ICreateCashier {
  sessionId: string
  cash: number
  credit: number
  creditTip: number
  location: CashierLocation
  receiptKey?: string
}

export interface IUpdateCashier {
  id: string
  timestamp: string
  sessionId?: string
  cash?: number
  credit?: number
  creditTip?: number
  location?: CashierLocation
  receiptKey?: string
  serial?: string
  group?: string
}

export interface ICashier extends ICreateCashier {
  id: string
  timestamp: string
  receiptUrl?: string
  serial?: string
  group?: string
}
