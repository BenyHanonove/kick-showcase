import { ref } from 'vue'
import { SnackbarStore } from '@stores'
import { extractErrorMessage } from '@shared/utils/extractErrorMessage.util'
import type { IProviderResult } from '@shared/providers/base.provider'

// Submit handler options interface
interface IFormSubmitOptions<TData> {
  successMessage?: string | ((data: TData) => string)
  onSuccess?: (data: TData) => void | Promise<void>
  errorMessage?: string
}

// Form submit helper hook
export function useFormSubmit() {
  const loading = ref(false)
  const snackbar = SnackbarStore()

  const submit = async <TData>(
    action: () => Promise<IProviderResult<TData>>,
    options?: IFormSubmitOptions<TData>,
  ): Promise<boolean> => {
    // Blocks a double-submit race from a rapid double-click/Enter
    if (loading.value) return false

    loading.value = true
    try {
      const result = await action()
      if (result.success) {
        if (options?.successMessage) {
          const msg = typeof options.successMessage === 'function'
            ? options.successMessage(result.data as TData)
            : options.successMessage
          snackbar.open(msg, 'success')
        }
        if (options?.onSuccess) {
          await options.onSuccess(result.data as TData)
        }
        return true
      } else {
        const msg = options?.errorMessage || result.message || 'פעולה נכשלה'
        snackbar.open(msg, 'error')
        return false
      }
    } catch (error) {
      const msg = options?.errorMessage || extractErrorMessage(error as Error)
      snackbar.open(msg, 'error')
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, submit }
}
