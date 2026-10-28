import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { ICreateVehicle, IUpdateVehicle, IVehicle } from '@vehicle/types/IVehicle.types'

export interface IVehicleFilters {
  sessionId: string
}

export interface IVehicleRepository {
  create(data: ICreateVehicle): Promise<IApiResponse<IVehicle>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IVehicle>>
  list(filters: IVehicleFilters): Promise<IApiResponse<IVehicle[]>>
  update(id: string, data: IUpdateVehicle): Promise<IApiResponse<IVehicle>>
}
