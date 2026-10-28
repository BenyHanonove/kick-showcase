import { ShiftRole } from '@shift/types/ShiftRole.types'

// Body of POST /shift/register - mirrors RegisterShiftDto; the token carries employee + session
export interface IRegisterShift {
  token: string
  role: ShiftRole
  notes?: string
}

// Response of POST /shift/resolve - everything the public page is allowed to see.
// Roles are not sent: the picker offers the whole static ShiftRole enum
export interface IResolvedShiftRegistration {
  employee: { firstName: string }
  session: { name: string; brand: string; datetime: string; location: string }
  registered: boolean
  // Set only when registered, so the confirmation names the role they actually hold
  registeredRole?: ShiftRole
}

// What the employee gets back after registering; pay fields never reach this page
export interface IShiftRegistrationResult {
  id: string
  role: ShiftRole
}

// Response of POST /shift/open/{sessionId} - one invited employee per call.
// `sent: false` still means a live token: the employee has no phone, or WhatsApp refused it
export interface IOpenShiftRegistrationResult {
  token: string
  sent: boolean
  expiresAt: string
}

// Plural labels read wrong when picking a single role for yourself
export const ShiftRoleSelfLabels: Record<ShiftRole, string> = {
  [ShiftRole.BARTENDER]: 'ברמן/ית',
  [ShiftRole.WAITER]: 'מלצר/ית',
  [ShiftRole.RUNNER]: 'ראנר/ית',
  [ShiftRole.BAR_MANAGER]: 'מנהל/ת בר',
  [ShiftRole.WAITER_MANAGER]: 'מנהל/ת מלצרים',
}
