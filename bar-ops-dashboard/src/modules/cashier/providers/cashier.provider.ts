import cashierRepository from '@cashier/repository/cashier.repository'

import { BaseReceiptProvider } from '@shared/providers/base.provider'
import { StatusCodes } from 'http-status-codes'

import type { ICashier, ICreateCashier, IUpdateCashier } from '@cashier/types/ICashier.types'
import type { ICashierFilters } from '@cashier/types/ICashierRepository.types'

import type { CashierLocation } from '@cashier/types/CashierLocation.types'

class CashierProvider extends BaseReceiptProvider<
  ICashier,
  ICreateCashier,
  IUpdateCashier,
  ICashier,
  ICashierFilters,
  {
    file: string
    sessionId: string
    id: string
    filename?: string
  },
  typeof cashierRepository
> {
  async createFromZReport(data: {
    file: string
    sessionId: string
    location: CashierLocation
    filename?: string
  }) {
    return this.safeCall(this.repository.createFromZReport(data), StatusCodes.CREATED)
  }
}

export const cashierProvider = new CashierProvider(cashierRepository)
