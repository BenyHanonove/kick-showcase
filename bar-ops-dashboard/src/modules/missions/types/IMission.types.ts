import { MissionStatus } from './status.types'

export interface IMission extends ICreateMission {
  id: string
  timestamp: string
  status: MissionStatus
  monthYear: string
}

export interface ICreateMission {
  sessionId: string
  name: string
  desc: string
  status?: MissionStatus
}

export interface IUpdateMission {
  id: string
  timestamp: string
  name?: string
  desc?: string
  status?: MissionStatus
}
