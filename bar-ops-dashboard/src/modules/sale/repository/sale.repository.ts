import api from '@shared/repository/api'

import { BaseRepository } from '@shared/repository/base.repository'

import type { ISale, ICreateSale, IUpdateSale, ISaleSummary } from '@sale/types/ISale.types'
import type { ISaleFilters, ISaleRepository } from '@sale/types/ISaleRepository.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'
import type { IApiResponse, IRawResponse } from '@shared/types/IApiResponse.types'

class SaleRepository
  extends BaseRepository<ISale, ICreateSale, IUpdateSale, ISale, ISaleFilters>
  implements ISaleRepository
{
  constructor() {
    super('/sale', 'sales', 'sale')
  }

  async summary(saleId: string): Promise<ISummaryReport> {
    return this.downloadBlob(`${this.endpoint}/summary/${saleId}`, `summary_${saleId}.pdf`)
  }

  async summaryByMonth(monthYear: string): Promise<IApiResponse<ISaleSummary[]>> {
    const response = await api.get<IRawResponse<ISaleSummary[]>>(`${this.endpoint}/summary`, {
      params: { monthYear },
    })
    return this.wrap<ISaleSummary[]>(response, this.pluralKey, [])
  }
}

export default new SaleRepository()
