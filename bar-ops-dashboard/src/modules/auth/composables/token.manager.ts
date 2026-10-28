import { authProvider } from '../providers/auth.provider'

import { AuthStore } from './auth.store'
import { tokenMemory } from './token.memory'

import type { IAuthTokens } from '../types/ICognito.types'

// Scheduled proactive refresh timer
let refreshTimeout: ReturnType<typeof setTimeout> | null = null

// Shared in-flight refresh so concurrent callers await one promise
let inFlightRefresh: Promise<boolean> | null = null

// Export token manager composable
export const useTokenManager = () => {
  const authStore = AuthStore()

  // Check if the token has expired
  const isTokenExpired = (expiresAt: number): boolean => {
    return Date.now() >= expiresAt
  }

  // Check if the token is expiring soon
  const isTokenExpiringsoon = (expiresAt: number, minutesBefore: number = 5): boolean => {
    const expirationThreshold = expiresAt - minutesBefore * 60 * 1000
    return Date.now() >= expirationThreshold
  }

  // Cancel the scheduled refresh
  const clearRefreshSchedule = () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }
  }

  // Schedule a proactive token refresh
  const scheduleTokenRefresh = (tokens: IAuthTokens) => {
    clearRefreshSchedule()

    const refreshTime = (tokens.ExpiresIn - 600) * 1000
    refreshTimeout = setTimeout(async () => {
      await refreshTokens()
    }, refreshTime)
  }

  // Refresh access token via the httpOnly refresh cookie
  const refreshTokens = (): Promise<boolean> => {
    // Join the refresh already in progress
    if (inFlightRefresh) return inFlightRefresh

    inFlightRefresh = (async () => {
      try {
        const result = await authProvider.refreshAccessToken()

        if (result.success && result.data?.authTokens) {
          tokenMemory.set(result.data.authTokens)
          authStore.set(result.data)
          scheduleTokenRefresh(result.data.authTokens)
          return true
        }

        authStore.logout()
        return false
      } finally {
        // Clear the guard for the next refresh
        inFlightRefresh = null
      }
    })()

    return inFlightRefresh
  }

  // Ensure the current token is valid, refreshing if needed
  const ensureTokenValid = async (): Promise<boolean> => {
    if (!tokenMemory.tokens.value) {
      authStore.logout()
      return false
    }

    if (isTokenExpired(tokenMemory.tokens.value.ExpiresAt)) {
      return await refreshTokens()
    }

    if (isTokenExpiringsoon(tokenMemory.tokens.value.ExpiresAt, 5)) {
      return await refreshTokens()
    }

    return true
  }

  // Start the refresh schedule
  const initializeTokenRefresh = (tokens: IAuthTokens) => {
    scheduleTokenRefresh(tokens)
  }

  return {
    isTokenExpired,
    isTokenExpiringsoon,
    refreshTokens,
    ensureTokenValid,
    initializeTokenRefresh,
    clearRefreshSchedule,
  }
}
