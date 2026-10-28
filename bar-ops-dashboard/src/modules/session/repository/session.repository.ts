// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

// Import types
import type { ISession, ICreateSession, IUpdateSession } from '@session/types/ISession.types'
import type { ISessionFilters, ISessionRepository } from '@session/types/ISessionRepository.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

// Extend base repository
class SessionRepository
  extends BaseRepository<ISession, ICreateSession, IUpdateSession, ISession, ISessionFilters>
  implements ISessionRepository
{
  constructor() {
    super('/session', 'sessions', 'session')
  }

  async summary(sessionId: string): Promise<ISummaryReport> {
    return this.downloadBlob(`${this.endpoint}/summary/${sessionId}`, `summary_${sessionId}.pdf`)
  }
}

export default new SessionRepository()
