import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type {
  IEmployee,
  ICreateEmployee,
  IRegisterEmployee,
  IUpdateEmployee,
  IEmployeeLink,
  ISelfUpdateEmployee,
  IClaimEmployee,
} from '@employee/types/IEmployee.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

export interface IEmployeeRepository {
  create(data: ICreateEmployee): Promise<IApiResponse<IEmployee>>
  register(data: IRegisterEmployee): Promise<IApiResponse<IEmployee>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IEmployee>>
  list(ids?: string[]): Promise<IApiResponse<IEmployee[]>>
  summary(sessionId: string, sessionName?: string): Promise<ISummaryReport>
  update(id: string, data: IUpdateEmployee): Promise<IApiResponse<IEmployee>>
  link(id: string): Promise<IApiResponse<IEmployeeLink>>
  resolve(token: string): Promise<IApiResponse<ISelfUpdateEmployee>>
  claim(data: IClaimEmployee): Promise<IApiResponse<IEmployee>>
  revoke(id: string): Promise<IApiResponse<boolean>>
}
