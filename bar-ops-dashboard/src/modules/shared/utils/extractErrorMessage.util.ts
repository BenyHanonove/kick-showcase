import { AxiosError } from 'axios'

// Extract message from error
export const extractErrorMessage = (
  error: Error | AxiosError | null | undefined,
  fallbackMessage = 'ארעה שגיאה בלתי צפויה',
): string => {
  if (!error) return fallbackMessage

  if (error instanceof AxiosError) {
    const responseData = error.response?.data as { message?: string } | undefined
    return responseData?.message || error.message
  }

  return error.message || String(error)
}
