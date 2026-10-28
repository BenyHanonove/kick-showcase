import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { ICreateTips, ITips, IUpdateTips } from '@tips/types/ITips.types'

export interface ITipsFilters {
  sessionId: string
}

export interface ITipsRepository {
  create(data: ICreateTips): Promise<IApiResponse<ITips>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<ITips>>
  list(filters: ITipsFilters): Promise<IApiResponse<ITips[]>>
  update(id: string, data: IUpdateTips): Promise<IApiResponse<ITips>>
}
