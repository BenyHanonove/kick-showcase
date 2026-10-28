import type { IAuthTokens } from './ICognito.types'

export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  USER = 'Users',
}

export interface IUser {
  email: string
  firstName: string
  lastName: string
  groups: UserRole[]
  authTokens?: IAuthTokens
}
