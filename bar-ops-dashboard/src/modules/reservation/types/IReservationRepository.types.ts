import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type {
  IReservation,
  ICreateReservation,
  IUpdateReservation,
} from '@reservation/types/IReservation.types'

export interface IReservationRepository {
  create(data: ICreateReservation): Promise<IApiResponse<IReservation>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IReservation>>
  list(ids: string[]): Promise<IApiResponse<IReservation[]>>
  update(id: string, data: IUpdateReservation): Promise<IApiResponse<IReservation>>
}
