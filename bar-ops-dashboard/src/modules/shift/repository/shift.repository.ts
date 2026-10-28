import { BaseRepository } from '@shared/repository/base.repository'

import type { IShift, ICreateShift, IUpdateShift, IShiftNotification } from '@shift/types/IShift.types'
import type { IShiftFilters, IShiftRepository } from '@shift/types/IShiftRepository.types'
import type {
  IOpenShiftRegistrationResult,
  IRegisterShift,
  IResolvedShiftRegistration,
  IShiftRegistrationResult,
} from '@shift/types/IShiftRegistration.types'

import api from '@shared/repository/api'
import type { IRawResponse } from '@shared/types/IApiResponse.types'

class ShiftRepository
  extends BaseRepository<IShift, ICreateShift, IUpdateShift, IShift, IShiftFilters>
  implements IShiftRepository
{
  constructor() {
    super('/shift', 'shifts', 'shift')
  }

  // Admin: broadcast the shift_assignment_notice template to everyone staffed on a session
  async notification(sessionId: string) {
    const response = await api.post<IRawResponse<IShiftNotification>>(`${this.endpoint}/notification/${sessionId}`)
    return this.wrap<IShiftNotification>(response, this.singularKey, {} as IShiftNotification)
  }

  // Admin: opens registration for one employee. Overwrite semantics - any live token this
  // employee already holds for the session is dropped and replaced
  async openRegistration(sessionId: string, employeeId: string) {
    const response = await api.post<IRawResponse<IOpenShiftRegistrationResult>>(
      `${this.endpoint}/open/${sessionId}`,
      { employeeId },
    )
    return this.wrap<IOpenShiftRegistrationResult>(
      response,
      this.singularKey,
      {} as IOpenShiftRegistrationResult,
    )
  }

  // Public: trades a registration token for the event details the page renders.
  // The route has no authorizer - the token in the body is the only credential
  async resolveRegistration(token: string) {
    const response = await api.post<IRawResponse<IResolvedShiftRegistration>>(
      `${this.endpoint}/resolve`,
      { token },
    )
    return this.wrap<IResolvedShiftRegistration>(response, this.singularKey, {} as IResolvedShiftRegistration)
  }

  // Public: spends the token and creates the shift. Single use - the server deletes the
  // token row, so a second call with the same token is rejected
  async register(data: IRegisterShift) {
    const response = await api.post<IRawResponse<IShiftRegistrationResult>>(
      `${this.endpoint}/register`,
      data,
    )
    return this.wrap<IShiftRegistrationResult>(response, this.singularKey, {} as IShiftRegistrationResult)
  }
}

export default new ShiftRepository()
