import { type ShiftRole } from '@shift/types/ShiftRole.types'
import { type ShiftRegistration } from '@shift/types/ShiftRegistration.types'

export interface ICreateShift {
  sessionId: string
  employeeId: string
  role: ShiftRole
  timing?: string
  bonusTravel?: number
  bonusManage?: number
  bonusOther?: number
  bonusSetup?: number
}

export interface IUpdateShift {
  id: string
  timestamp: string
  role?: ShiftRole
  timing?: string
  bonusTravel?: number
  bonusManage?: number
  bonusOther?: number
  bonusSetup?: number
  hourly?: number | null
  approved?: boolean
  registration?: ShiftRegistration
  received?: boolean
  notes?: string
}

export interface IShift extends ICreateShift {
  id: string
  totalHours: number
  hourly?: number | null
  timestamp: string
  approved: boolean
  registration: ShiftRegistration
  received: boolean
  notes: string
}

// Per-employee outcome inside a session broadcast
export interface IShiftNotificationRecipient {
  shiftId: string
  employeeId: string
  name?: string
  sent: boolean
  reason?: string
}

// Result of broadcasting the shift_assignment_notice template across a session's shifts
export interface IShiftNotification {
  session: string
  template?: string
  total: number
  sent: number
  failed: number
  recipients: IShiftNotificationRecipient[]
}
