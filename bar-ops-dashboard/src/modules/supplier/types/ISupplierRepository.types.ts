import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'
import type { ISupplier, ICreateSupplier, IUpdateSupplier } from '@supplier/types/ISupplier.types'

export interface ISupplierRepository {
  create(data: ICreateSupplier): Promise<IApiResponse<ISupplier>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<ISupplier>>
  list(ids?: string[]): Promise<IApiResponse<ISupplier[]>>
  summary(id: string, monthYear: string): Promise<ISummaryReport>
  update(id: string, data: IUpdateSupplier): Promise<IApiResponse<ISupplier>>
}
