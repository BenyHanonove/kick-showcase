import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { IClient, ICreateClient, IUpdateClient } from '@client/types/IClient.types'

export interface IClientRepository {
  create(data: ICreateClient): Promise<IApiResponse<IClient>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IClient>>
  list(ids: string[]): Promise<IApiResponse<IClient[]>>
  update(id: string, data: IUpdateClient): Promise<IApiResponse<IClient>>
}
