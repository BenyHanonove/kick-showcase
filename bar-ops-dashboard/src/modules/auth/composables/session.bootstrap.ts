import { useTokenManager } from './token.manager'

// Max time to wait before mounting the app anyway (avoids a stuck/blank page on slow or dropped requests)
const REHYDRATE_TIMEOUT_MS = 5000

// Silently restores a session from the httpOnly refresh cookie
export const rehydrateSession = async (): Promise<void> => {
  await Promise.race([
    useTokenManager().refreshTokens(),
    new Promise((resolve) => setTimeout(resolve, REHYDRATE_TIMEOUT_MS)),
  ])
}
