import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { IConsume, ICreateConsume, IUpdateConsume } from '@consume/types/IConsume.types'

export interface IConsumeFilters {
  sessionId: string
}

export interface IConsumeRepository {
  create(data: ICreateConsume): Promise<IApiResponse<IConsume>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IConsume>>
  list(filters: IConsumeFilters): Promise<IApiResponse<IConsume[]>>
  update(id: string, data: IUpdateConsume): Promise<IApiResponse<IConsume>>
}
