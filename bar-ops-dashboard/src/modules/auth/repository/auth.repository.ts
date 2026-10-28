import axios from 'axios'

import api from '@shared/repository/api'

import { env } from '@plugins'

import type { IAuthRepository } from '@auth/types/IAuthRepository.types'
import type { ILoginRequest, IRegisterRequest } from '@auth/types/IRequests.types'
import type { IUser } from '@auth/types/IUser.types'
import type { IAuthTokens } from '@auth/types/ICognito.types'

interface IAuthResponsePayload {
  user: Omit<IUser, 'authTokens'>
  authTokens: IAuthTokens
}

// Implement auth repository
class AuthRepository implements IAuthRepository {
  private readonly idpUrl = env.cognito.idpUrl

  private toUser({ user, authTokens }: IAuthResponsePayload): IUser {
    return { ...user, authTokens }
  }

  // Method to login via the backend
  async login(credentials: ILoginRequest): Promise<IUser> {
    const { data } = await api.post<{ data: IAuthResponsePayload }>('/auth/login', credentials)
    return this.toUser(data.data)
  }

  // Method to register to cognito user pool
  async register(data: IRegisterRequest): Promise<boolean> {
    await axios.post(
      this.idpUrl,
      {
        ClientId: env.cognito.clientId,
        Username: data.email,
        Password: data.password,
        UserAttributes: [
          { Name: 'email', Value: data.email },
          { Name: 'given_name', Value: data.firstName },
          { Name: 'family_name', Value: data.lastName },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
        },
      },
    )
    return true
  }

  // Method to logout (best-effort backend revoke)
  async logout(): Promise<void> {
    await api.post('/auth/logout')
  }

  // Method to silently refresh the session
  async refreshAccessToken(): Promise<IUser> {
    const { data } = await api.post<{ data: IAuthResponsePayload }>('/auth/refresh')
    return this.toUser(data.data)
  }

  // Method to request password reset
  async forgotPassword(email: string): Promise<void> {
    await axios.post(
      this.idpUrl,
      {
        ClientId: env.cognito.clientId,
        Username: email,
      },
      {
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ForgotPassword',
        },
      },
    )
  }

  // Method to confirm password reset
  async confirmForgotPassword(email: string, code: string, password: string): Promise<void> {
    await axios.post(
      this.idpUrl,
      {
        ClientId: env.cognito.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: password,
      },
      {
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmForgotPassword',
        },
      },
    )
  }
}

export default new AuthRepository()
