// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

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

import api from '@shared/repository/api'
import type { IRawResponse } from '@shared/types/IApiResponse.types'

// Extend base repository
class EmployeeRepository
  extends BaseRepository<IEmployee, ICreateEmployee, IUpdateEmployee>
  implements IEmployeeRepository
{
  constructor() {
    super('/employee', 'employees', 'employee')
  }

  async register(data: IRegisterEmployee) {
    const response = await api.post<IRawResponse<IEmployee>>(`${this.endpoint}/register`, data)
    return this.wrap<IEmployee>(response, this.singularKey, {} as IEmployee)
  }

  async summary(sessionId: string, sessionName?: string): Promise<ISummaryReport> {
    const formattedSessionName = sessionName || 'דוח'
    const fileName = `${formattedSessionName}_רשימת_עובדים.xlsx`.replace(/\s+/g, '_')
    return this.downloadBlob(`${this.endpoint}/summary/${sessionId}`, fileName)
  }

  // Admin: generate a self-update token and send it to the employee
  async link(id: string) {
    const response = await api.post<IRawResponse<IEmployeeLink>>(`${this.endpoint}/link/${id}`)
    return this.wrap<IEmployeeLink>(response, this.singularKey, {} as IEmployeeLink)
  }

  // Public: resolve a token into the employee's current self-editable fields
  async resolve(token: string) {
    const response = await api.post<IRawResponse<ISelfUpdateEmployee>>(`${this.endpoint}/resolve`, {
      token,
    })
    return this.wrap<ISelfUpdateEmployee>(response, this.singularKey, {} as ISelfUpdateEmployee)
  }

  // Public: submit self-update changes, consuming the token
  async claim(data: IClaimEmployee) {
    const response = await api.post<IRawResponse<IEmployee>>(`${this.endpoint}/claim`, data)
    return this.wrap<IEmployee>(response, this.singularKey, {} as IEmployee)
  }

  // Admin: cancel an outstanding self-update token early
  async revoke(id: string) {
    const response = await api.post<IRawResponse<boolean>>(`${this.endpoint}/revoke/${id}`)
    return {
      data: response.status >= 200 && response.status < 300,
      statusCode: response.status,
      message: response.data?.message ?? '',
    }
  }
}

export default new EmployeeRepository()
