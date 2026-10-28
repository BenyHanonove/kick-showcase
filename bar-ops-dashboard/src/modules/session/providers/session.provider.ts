// Import repository
import SessionRepository from '@session/repository/session.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type { ISession, ICreateSession, IUpdateSession } from '@session/types/ISession.types'
import type { ISessionFilters, ISessionRepository } from '@session/types/ISessionRepository.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

// Extend base provider
class SessionProvider extends BaseCrudProvider<
  ISession,
  ICreateSession,
  IUpdateSession,
  ISession,
  ISessionFilters,
  ISessionRepository
> {
  constructor() {
    super(SessionRepository)
  }

  // Method to download session summary
  async summary(sessionId: string): Promise<ISummaryReport> {
    return this.repository.summary(sessionId)
  }
}

export const sessionProvider = new SessionProvider()
