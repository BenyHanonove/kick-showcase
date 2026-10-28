import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { IInterval, ICreateInterval, IUpdateInterval } from '@interval/types/IInterval.types'

// Define filters interface
export interface IIntervalFilters {
  shiftId: string
}

// Define repository interface
export interface IIntervalRepository {
  create(data: ICreateInterval): Promise<IApiResponse<IInterval>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IInterval>>
  list(filters: IIntervalFilters): Promise<IApiResponse<IInterval[]>>
  update(id: string, data: IUpdateInterval): Promise<IApiResponse<IInterval>>
}
