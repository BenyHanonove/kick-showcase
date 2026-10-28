import { type IStatusMeta, buildStatusOptions } from '../../shared/types/IStatusMeta.types'

export enum MissionStatus {
  PENDING = 'pending',
  WORKING = 'working',
  COMPLETED = 'completed',
}

export const MissionStatusMeta: Record<MissionStatus, IStatusMeta> = {
  [MissionStatus.PENDING]: {
    label: 'בהמתנה',
    color: 'warning',
    icon: 'mdi-checkbox-blank-circle-outline',
  },
  [MissionStatus.WORKING]: {
    label: 'בטיפול',
    color: 'info',
    icon: 'mdi-play-circle-outline',
  },
  [MissionStatus.COMPLETED]: {
    label: 'הושלם',
    color: 'success',
    icon: 'mdi-check-circle',
  },
}

export const getMissionStatusMeta = (status?: MissionStatus): IStatusMeta =>
  MissionStatusMeta[status ?? MissionStatus.PENDING] ?? MissionStatusMeta[MissionStatus.PENDING]

// Ready-to-use options for status select inputs (Hebrew labels)
export const missionStatusOptions = buildStatusOptions(MissionStatusMeta)

