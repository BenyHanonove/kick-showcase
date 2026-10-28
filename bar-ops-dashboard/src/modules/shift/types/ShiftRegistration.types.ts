// Staffing decision, separate from `approved` (hours correctness)
export enum ShiftRegistration {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const ShiftRegistrationLabels: Record<ShiftRegistration, string> = {
  [ShiftRegistration.PENDING]: 'ממתינים',
  [ShiftRegistration.APPROVED]: 'מאושרים',
  [ShiftRegistration.REJECTED]: 'נדחו',
}

// Theme color names so they work in light and dark
export const ShiftRegistrationColors: Record<ShiftRegistration, string> = {
  [ShiftRegistration.PENDING]: 'warning',
  [ShiftRegistration.APPROVED]: 'success',
  [ShiftRegistration.REJECTED]: 'error',
}
