export enum EmployeeLevel {
  TRAINEE = 'trainee',
  JUNIOR = 'junior',
  EXPERIENCED = 'experienced',
  SENIOR = 'senior',
  EXPERT = 'expert',
}

export const EmployeeLevelLabels: Record<EmployeeLevel, string> = {
  [EmployeeLevel.TRAINEE]: 'מתלמד',
  [EmployeeLevel.JUNIOR]: 'מתחיל',
  [EmployeeLevel.EXPERIENCED]: 'מנוסה',
  [EmployeeLevel.SENIOR]: 'בכיר',
  [EmployeeLevel.EXPERT]: 'מומחה',
}

// Ordered lowest to highest, index + 1 = numeric level
export const EmployeeLevelOrder: EmployeeLevel[] = [
  EmployeeLevel.TRAINEE,
  EmployeeLevel.JUNIOR,
  EmployeeLevel.EXPERIENCED,
  EmployeeLevel.SENIOR,
  EmployeeLevel.EXPERT,
]

export const EmployeeLevelIcons: Record<EmployeeLevel, string> = {
  [EmployeeLevel.TRAINEE]: 'mdi-numeric-1-circle-outline',
  [EmployeeLevel.JUNIOR]: 'mdi-numeric-2-circle-outline',
  [EmployeeLevel.EXPERIENCED]: 'mdi-numeric-3-circle-outline',
  [EmployeeLevel.SENIOR]: 'mdi-numeric-4-circle-outline',
  [EmployeeLevel.EXPERT]: 'mdi-numeric-5-circle-outline',
}

// Theme color names so they work in light and dark
export const EmployeeLevelColors: Record<EmployeeLevel, string> = {
  [EmployeeLevel.TRAINEE]: 'info',
  [EmployeeLevel.JUNIOR]: 'success',
  [EmployeeLevel.EXPERIENCED]: 'primary',
  [EmployeeLevel.SENIOR]: 'secondary',
  [EmployeeLevel.EXPERT]: 'warning',
}
