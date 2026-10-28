import type { UserRole } from './IUser.types'

// RefreshToken never reaches the frontend; stays in httpOnly cookie
export interface IAuthTokens {
  AccessToken: string
  IdToken: string
  ExpiresIn: number
  ExpiresAt: number
}

export interface ICognitoAttribute {
  Name: string
  Value: string
}

export interface ICognitoIdTokenPayload {
  email: string
  'cognito:groups'?: UserRole[]
  given_name?: string
  family_name?: string
  exp: number
  iss: string
}
