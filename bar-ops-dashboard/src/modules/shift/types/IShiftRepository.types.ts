import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { IShift, ICreateShift, IUpdateShift, IShiftNotification } from '@shift/types/IShift.types'
import type {
  IOpenShiftRegistrationResult,
  IRegisterShift,
  IResolvedShiftRegistration,
  IShiftRegistrationResult,
} from '@shift/types/IShiftRegistration.types'

export interface IShiftFilters {
  sessionId?: string
  employeeId?: string
}

export interface IShiftRepository {
  create(data: ICreateShift): Promise<IApiResponse<IShift>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IShift>>
  list(filters: IShiftFilters): Promise<IApiResponse<IShift[]>>
  update(id: string, data: IUpdateShift): Promise<IApiResponse<IShift>>
  notification(sessionId: string): Promise<IApiResponse<IShiftNotification>>
  // Admin: mints a 24h token for one employee and WhatsApps them the link
  openRegistration(
    sessionId: string,
    employeeId: string,
  ): Promise<IApiResponse<IOpenShiftRegistrationResult>>
  // Public, token-authenticated: no Cognito session is involved
  resolveRegistration(token: string): Promise<IApiResponse<IResolvedShiftRegistration>>
  register(data: IRegisterShift): Promise<IApiResponse<IShiftRegistrationResult>>
}
