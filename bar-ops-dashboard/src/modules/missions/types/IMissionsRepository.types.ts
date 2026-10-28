import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { ICreateMission, IMission, IUpdateMission } from '@missions/types/IMission.types'

export interface IMissionsFilters {
  sessionId?: string
  monthYear?: string
}

export interface IMissionsRepository {
  create(data: ICreateMission): Promise<IApiResponse<IMission>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IMission>>
  list(filters: IMissionsFilters): Promise<IApiResponse<IMission[]>>
  update(id: string, data: IUpdateMission): Promise<IApiResponse<IMission>>
}
