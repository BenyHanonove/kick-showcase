import { type IStatusMeta, buildStatusOptions } from '../../shared/types/IStatusMeta.types'

export enum SessionStatus {
  ACTIVE = 'active',
  CLOSE = 'close',
  FLAG = 'flag',
}

export const SessionStatusMeta: Record<SessionStatus, IStatusMeta> = {
  [SessionStatus.ACTIVE]: {
    label: 'פעיל',
    color: 'primary',
    icon: 'mdi-play-circle',
  },
  [SessionStatus.FLAG]: {
    label: 'דרוש טיפול',
    color: 'warning',
    icon: 'mdi-flag',
  },
  [SessionStatus.CLOSE]: {
    label: 'סגור',
    color: 'success',
    icon: 'mdi-check-circle',
  },
}

export const getSessionStatusMeta = (status?: SessionStatus): IStatusMeta =>
  SessionStatusMeta[status ?? SessionStatus.ACTIVE] ?? SessionStatusMeta[SessionStatus.ACTIVE]

// Ready-to-use options for status select inputs (Hebrew labels)
export const sessionStatusOptions = buildStatusOptions(SessionStatusMeta)

