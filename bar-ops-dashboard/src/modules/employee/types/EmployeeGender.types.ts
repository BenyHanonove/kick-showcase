export enum EmployeeGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export const EmployeeGenderLabels: Record<EmployeeGender, string> = {
  [EmployeeGender.MALE]: 'זכר',
  [EmployeeGender.FEMALE]: 'נקבה',
  [EmployeeGender.OTHER]: 'אחר',
}
