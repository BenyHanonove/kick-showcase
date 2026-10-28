import type { IEmployee, ICreateEmployee } from '@employee/types/IEmployee.types'

// Fields the self-register / self-update forms collect
const requiredFields: Array<[keyof ICreateEmployee, string]> = [
  ['firstName', 'שם פרטי'],
  ['lastName', 'שם משפחה'],
  ['identityNumber', 'תעודת זהות'],
  ['phone', 'טלפון'],
  ['gender', 'מגדר'],
  ['instagram', 'אינסטגרם'],
  ['address', 'כתובת'],
]

// Labels of empty fields for old employees created before the DTO update
export const getMissingFields = (employee: IEmployee): string[] =>
  requiredFields
    .filter(([key]) => {
      const value = employee[key]
      return typeof value !== 'string' || value.trim().length === 0
    })
    .map(([, label]) => label)
