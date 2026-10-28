import type { ServiceArea } from '@tips/types/ServiceArea.types'

export interface ICreateTips {
  sessionId: string
  area: ServiceArea
  cashTip: number
  creditTip: number
  totalHours: number
  runnerFeed: number
}

export interface IUpdateTips {
  id: string
  timestamp: string
  area?: ServiceArea
  cashTip?: number
  creditTip?: number
  totalHours?: number
  runnerFeed?: number
}

export interface ITips extends ICreateTips {
  id: string
  timestamp: string
}
