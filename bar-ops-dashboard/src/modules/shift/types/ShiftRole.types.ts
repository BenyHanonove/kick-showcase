export enum ShiftRole {
  BARTENDER = 'bartender',
  WAITER = 'waiter',
  RUNNER = 'runner',
  BAR_MANAGER = 'barmanger',
  WAITER_MANAGER = 'waitermanger',
}

export const ShiftRoleLabels: Record<ShiftRole, string> = {
  [ShiftRole.BARTENDER]: 'ברמנים',
  [ShiftRole.WAITER]: 'מלצרים',
  [ShiftRole.RUNNER]: 'ראנרים',
  [ShiftRole.BAR_MANAGER]: 'מנהלי בר',
  [ShiftRole.WAITER_MANAGER]: 'מנהלי מלצרים',
}
