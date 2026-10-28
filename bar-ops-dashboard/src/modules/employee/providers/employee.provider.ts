// Import repository
import employeeRepository from '@employee/repository/employee.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'
import type { IProviderResult } from '@shared/providers/base.provider'
import { StatusCodes } from 'http-status-codes'

// Import types
import type {
  IEmployee,
  ICreateEmployee,
  IRegisterEmployee,
  IUpdateEmployee,
  IEmployeeLink,
  ISelfUpdateEmployee,
  IClaimEmployee,
} from '@employee/types/IEmployee.types'
import type { IEmployeeRepository } from '@employee/types/IEmployeeRepository.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

// Extend base provider
class EmployeeProvider extends BaseCrudProvider<
  IEmployee,
  ICreateEmployee,
  IUpdateEmployee,
  IEmployee,
  string[],
  IEmployeeRepository
> {
  constructor() {
    super(employeeRepository)
  }

  // Method to register a pending employee
  async register(payload: IRegisterEmployee): Promise<IProviderResult<IEmployee>> {
    return this.safeCall(this.repository.register(payload), StatusCodes.CREATED)
  }

  // Method to download employee summary
  async summary(sessionId: string, sessionName?: string): Promise<ISummaryReport> {
    return this.repository.summary(sessionId, sessionName)
  }

  // Admin: generate and send a self-update link to the employee
  async link(id: string): Promise<IProviderResult<IEmployeeLink>> {
    return this.safeCall(this.repository.link(id))
  }

  // Public: resolve a self-update token into editable employee data
  async resolve(token: string): Promise<IProviderResult<ISelfUpdateEmployee>> {
    return this.safeCall(this.repository.resolve(token))
  }

  // Public: submit self-update changes via token
  async claim(payload: IClaimEmployee): Promise<IProviderResult<IEmployee>> {
    return this.safeCall(this.repository.claim(payload))
  }

  // Admin: cancel an outstanding self-update token early
  async revoke(id: string): Promise<IProviderResult<boolean>> {
    return this.safeCall(this.repository.revoke(id))
  }
}

export const employeeProvider = new EmployeeProvider()
