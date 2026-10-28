import { StatusCodes } from 'http-status-codes'

import shiftRepository from '@shift/repository/shift.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'
import type { IProviderResult } from '@shared/providers/base.provider'

import type { IShift, ICreateShift, IUpdateShift, IShiftNotification } from '@shift/types/IShift.types'
import type { IShiftFilters, IShiftRepository } from '@shift/types/IShiftRepository.types'
import type {
  IOpenShiftRegistrationResult,
  IRegisterShift,
  IResolvedShiftRegistration,
  IShiftRegistrationResult,
} from '@shift/types/IShiftRegistration.types'

class ShiftProvider extends BaseCrudProvider<
  IShift,
  ICreateShift,
  IUpdateShift,
  IShift,
  IShiftFilters,
  IShiftRepository
> {
  constructor() {
    super(shiftRepository)
  }

  // Admin: broadcast the shift assignment WhatsApp template across a session
  async notification(sessionId: string): Promise<IProviderResult<IShiftNotification>> {
    return this.safeCall(this.repository.notification(sessionId))
  }

  // Admin: invites one employee to self-register for a session
  async openRegistration(
    sessionId: string,
    employeeId: string,
  ): Promise<IProviderResult<IOpenShiftRegistrationResult>> {
    return this.safeCall(this.repository.openRegistration(sessionId, employeeId))
  }

  // Public: any failure here means the link is bad - unknown, expired, spent or revoked.
  // safeCall turns the server's 400 into success:false plus its generic Hebrew message
  async resolveRegistration(token: string): Promise<IProviderResult<IResolvedShiftRegistration>> {
    return this.safeCall(this.repository.resolveRegistration(token))
  }

  // Public: 201 on success. A 409 means the employee is already staffed on this event
  async register(data: IRegisterShift): Promise<IProviderResult<IShiftRegistrationResult>> {
    return this.safeCall(this.repository.register(data), StatusCodes.CREATED)
  }
}

export const shiftProvider = new ShiftProvider()
