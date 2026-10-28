import { ref } from 'vue'
import type { IAuthTokens } from '../types/ICognito.types'

// Deliberately outside Pinia/localStorage — lost on refresh/tab close
const tokens = ref<IAuthTokens | null>(null)

// ExpiresAt is recomputed on the local clock; the server's is wrong on skewed devices
const set = (_tokens: IAuthTokens | null) => {
  tokens.value = _tokens && { ..._tokens, ExpiresAt: Date.now() + _tokens.ExpiresIn * 1000 }
}

const clear = () => {
  tokens.value = null
}

export const tokenMemory = {
  tokens,
  set,
  clear,
}
