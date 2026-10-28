import axios from 'axios'
import { env } from '@plugins'
import { AuthStore } from '@stores'
import { tokenMemory } from '@auth/composables/token.memory'

const api = axios.create({
  baseURL: env.api.baseUrl,
  timeout: env.api.timeoutMs,
  // Sends the httpOnly refresh cookie to the backend
  withCredentials: true,
})

// Excluded from the 401-retry flow — a refresh 401 means session over
const AUTH_ROUTES = ['/auth/login', '/auth/refresh', '/auth/logout']
const isAuthRoute = (url?: string): boolean => !!url && AUTH_ROUTES.some((path) => url.includes(path))

import type { InternalAxiosRequestConfig, AxiosError } from 'axios'

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

// Queue for pending requests
interface QueuedRequest {
  resolve: () => void
  reject: (error: AxiosError | Error) => void
}

let isRefreshing = false
let refreshQueue: QueuedRequest[] = []

const flushQueue = (error: AxiosError | Error | null) => {
  refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()))
  refreshQueue = []
}

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
  const token = tokenMemory.tokens.value?.AccessToken

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Response Interceptor: Refresh 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined

    // Retry request at most once, never for the auth routes themselves
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retried ||
      isAuthRoute(originalRequest.url)
    ) {
      return Promise.reject(error)
    }

    const authStore = AuthStore()

    // Queue requests during active refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: () => {
            originalRequest.headers.Authorization = `Bearer ${tokenMemory.tokens.value?.AccessToken}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    isRefreshing = true
    originalRequest._retried = true

    try {
      // Trigger token refresh process
      const { useTokenManager } = await import('@auth/composables/token.manager')
      const refreshed = await useTokenManager().refreshTokens()

      if (refreshed && tokenMemory.tokens.value?.AccessToken) {
        originalRequest.headers.Authorization = `Bearer ${tokenMemory.tokens.value.AccessToken}`
        flushQueue(null)
        return api(originalRequest)
      }

      // Logout if refresh fails
      flushQueue(error)
      authStore.logout()
      const { default: router } = await import('@router')
      await router.push({ name: 'landing' })
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
