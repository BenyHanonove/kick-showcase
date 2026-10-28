import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { ISale, ICreateSale, IUpdateSale, ISaleSummary } from '@sale/types/ISale.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

export interface ISaleFilters {
  clientId?: string | null
  monthYear?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface ISaleRepository {
  create(data: ICreateSale): Promise<IApiResponse<ISale>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<ISale>>
  list(filters?: ISaleFilters): Promise<IApiResponse<ISale[]>>
  summary(saleId: string): Promise<ISummaryReport>
  summaryByMonth(monthYear: string): Promise<IApiResponse<ISaleSummary[]>>
  update(id: string, data: IUpdateSale): Promise<IApiResponse<ISale>>
}
