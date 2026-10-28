export enum EmployeeType {
  BARTENDER = 'bartender',
  WAITER = 'waiter',
  HYBRID = 'hybrid',
  MANAGER = 'manager',
  SETUP = 'setup',
}

export const EmployeeTypeLabels: Record<EmployeeType, string> = {
  [EmployeeType.BARTENDER]: 'ברמן',
  [EmployeeType.WAITER]: 'מלצר',
  [EmployeeType.HYBRID]: 'משולב',
  [EmployeeType.MANAGER]: 'מנהל',
  [EmployeeType.SETUP]: 'הקמות',
}
