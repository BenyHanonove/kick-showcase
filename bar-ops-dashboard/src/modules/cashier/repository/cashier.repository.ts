// Import base repository
import { BaseReceiptRepository } from '@shared/repository/base.repository'
import api from '@shared/repository/api'
import type { IRawResponse } from '@shared/types/IApiResponse.types'

// Import types
import type { ICashier, ICreateCashier, IUpdateCashier } from '@cashier/types/ICashier.types'
import type { ICashierFilters, ICashierRepository } from '@cashier/types/ICashierRepository.types'
import type { CashierLocation } from '@cashier/types/CashierLocation.types'

class CashierRepository
  extends BaseReceiptRepository<ICashier, ICreateCashier, IUpdateCashier, ICashier, ICashierFilters>
  implements ICashierRepository
{
  constructor() {
    super('/cashier', 'cashiers', 'cashier')
  }

  async createFromZReport(data: {
    file: string
    sessionId: string
    location: CashierLocation
    filename?: string
  }) {
    const response = await api.post<IRawResponse<ICashier>>(`${this.endpoint}/presign`, data)
    return this.wrap<ICashier>(response, this.singularKey, {} as ICashier)
  }
}

const cashierRepository = new CashierRepository()

export default cashierRepository
