// Import libraries
import { AxiosError } from 'axios'

// Import repository
import authRepository from '../repository/auth.repository'

// Import base provider
import { BaseProvider, type IProviderResult } from '@shared/providers/base.provider'
import { extractErrorMessage } from '@shared/utils/extractErrorMessage.util'

// Import types
import type { IAuthRepository } from '@auth/types/IAuthRepository.types'
import type { IUser } from '@auth/types/IUser.types'
import type { ILoginRequest, IRegisterRequest } from '@auth/types/IRequests.types'

// Extend base provider
export class AuthProvider extends BaseProvider {
  constructor(private readonly repository: IAuthRepository) {
    super()
  }

  // Method to run auth tasks safely
  private async safeAuthCall<T>(task: () => Promise<T>): Promise<IProviderResult<T>> {
    try {
      const data = await task()
      return { success: true, message: '', data }
    } catch (error) {
      const message = extractErrorMessage(error as Error | AxiosError, 'ארעה שגיאה בתהליך האימות')
      return { success: false, message, data: null }
    }
  }

  // Method to login user account
  async login(data: ILoginRequest): Promise<IProviderResult<IUser>> {
    return this.safeAuthCall(() => this.repository.login(data))
  }

  // Method to register user account
  async register(data: IRegisterRequest): Promise<IProviderResult<boolean>> {
    return this.safeAuthCall(() => this.repository.register(data))
  }

  // Refresh access token via httpOnly cookie
  async refreshAccessToken(): Promise<IProviderResult<IUser>> {
    return this.safeAuthCall(() => this.repository.refreshAccessToken())
  }

  // Method to log out (best-effort backend revoke)
  async logout(): Promise<IProviderResult<void>> {
    return this.safeAuthCall(() => this.repository.logout())
  }

  // Method to initiate password reset
  async forgotPassword(email: string): Promise<IProviderResult<boolean>> {
    return this.safeAuthCall(async () => {
      await this.repository.forgotPassword(email)
      return true
    })
  }

  // Method to complete password reset
  async confirmForgotPassword(
    email: string,
    code: string,
    password: string,
  ): Promise<IProviderResult<boolean>> {
    return this.safeAuthCall(async () => {
      await this.repository.confirmForgotPassword(email, code, password)
      return true
    })
  }
}

export const authProvider = new AuthProvider(authRepository)
