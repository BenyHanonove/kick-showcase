export enum EmployeeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

export const EmployeeStatusLabels: Record<EmployeeStatus, string> = {
  [EmployeeStatus.PENDING]: 'ממתין לאישור',
  [EmployeeStatus.APPROVED]: 'מאושר',
}
