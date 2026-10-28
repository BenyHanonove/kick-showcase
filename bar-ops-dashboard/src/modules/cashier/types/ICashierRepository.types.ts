import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { ICashier, ICreateCashier, IUpdateCashier } from '@cashier/types/ICashier.types'
import type { CashierLocation } from '@cashier/types/CashierLocation.types'

export interface ICashierFilters {
  sessionId: string
}

export interface ICashierRepository {
  create(data: ICreateCashier): Promise<IApiResponse<ICashier>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<ICashier>>
  list(filters: ICashierFilters): Promise<IApiResponse<ICashier[]>>
  update(id: string, data: IUpdateCashier): Promise<IApiResponse<ICashier>>
  presign(data: {
    file: string
    sessionId: string
    id: string
    filename?: string
  }): Promise<IApiResponse<ICashier>>
  unsign(id: string): Promise<IApiResponse<ICashier>>
  createFromZReport(data: {
    file: string
    sessionId: string
    location: CashierLocation
    filename?: string
  }): Promise<IApiResponse<ICashier>>
}
