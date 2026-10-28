import type { SessionType } from '@session/types/SessionType.types'
import type { SessionStatus } from '@session/types/status.types'

export interface ISession extends ICreateSession {
  id: string
  timestamp: string
  status: SessionStatus
  barmanAmount?: number
  waitersAmount?: number
  barMangerAmount?: number
  waiterMangerAmount?: number
  Runners?: number
  split?: number
  notes?: string
}

export interface ICreateSession {
  clientId: string
  datetime: string
  name: string
  peopleAmount: number
  location: string
  processingFee: number
  type: SessionType
}

export interface IUpdateSession {
  id: string
  timestamp: string
  clientId?: string
  datetime?: string
  name?: string
  peopleAmount?: number
  processingFee?: number
  location?: string
  type?: SessionType
  status?: SessionStatus
  barmanAmount?: number
  waitersAmount?: number
  barMangerAmount?: number
  waiterMangerAmount?: number
  Runners?: number
  split?: number
  notes?: string
}
