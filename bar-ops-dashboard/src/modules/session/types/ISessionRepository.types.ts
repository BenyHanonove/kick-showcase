import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { ISession, ICreateSession, IUpdateSession } from '@session/types/ISession.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

export interface ISessionFilters {
  clientId?: string | null
  monthYear?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface ISessionRepository {
  create(data: ICreateSession): Promise<IApiResponse<ISession>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<ISession>>
  list(filters?: ISessionFilters): Promise<IApiResponse<ISession[]>>
  summary(sessionId: string): Promise<ISummaryReport>
  update(id: string, data: IUpdateSession): Promise<IApiResponse<ISession>>
}
