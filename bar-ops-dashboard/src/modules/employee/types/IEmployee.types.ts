import { EmployeeType } from './EmployeeType.types'
import { EmployeeStatus } from './EmployeeStatus.types'
import { EmployeeLevel } from './EmployeeLevel.types'
import { EmployeeGender } from './EmployeeGender.types'

export interface ICreateEmployee {
  firstName: string
  lastName: string
  identityNumber: string
  phone: string
  type?: EmployeeType
  level?: EmployeeLevel
  gender?: EmployeeGender
  workExperience?: string
  instagram?: string
  address?: string
}

// Public self-register, gender is required
export interface IRegisterEmployee extends ICreateEmployee {
  gender: EmployeeGender
}

export interface IUpdateEmployee {
  id: string
  timestamp: string
  firstName?: string
  lastName?: string
  identityNumber?: string
  phone?: string
  type?: EmployeeType
  level?: EmployeeLevel
  gender?: EmployeeGender
  status?: EmployeeStatus
  workExperience?: string
  instagram?: string
  address?: string
}

export interface IEmployee extends ICreateEmployee {
  id: string
  status?: EmployeeStatus
  timestamp: string
}

export interface IEmployeeLink {
  token: string
  expiresAt: string
  notified: boolean
}

export interface ISelfUpdateEmployee {
  firstName: string
  lastName: string
  identityNumber: string
  phone: string
  workExperience: string
  instagram: string
  address: string
  gender: EmployeeGender
  timestamp: string
}

export interface IClaimEmployee extends ISelfUpdateEmployee {
  token: string
}
