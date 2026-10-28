import type { ILoginRequest, IRegisterRequest } from '@auth/types/IRequests.types'
import type { IUser } from '@auth/types/IUser.types'

export interface IAuthRepository {
  login(credentials: ILoginRequest): Promise<IUser>
  register(data: IRegisterRequest): Promise<boolean>
  logout(): Promise<void>
  refreshAccessToken(): Promise<IUser>
  forgotPassword(email: string): Promise<void>
  confirmForgotPassword(email: string, code: string, password: string): Promise<void>
}
