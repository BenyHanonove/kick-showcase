// Import vue APIs
import { ref } from 'vue'

// Import vue-router APIs
import { useRouter } from 'vue-router'

// Import stores
import { AuthStore, SnackbarStore } from '@stores'

// Import providers
import { authProvider } from '../providers/auth.provider'

// Import composables
import { useTokenManager } from './token.manager'
import { tokenMemory } from './token.memory'
import { useFormSubmit } from '@shared/composables/formSubmit.composable'

// Import types
import type { ILoginRequest, IRegisterRequest } from '@auth/types/IRequests.types'

// Export auth crud composable
export function useAuthCrud() {
  const router = useRouter()
  const authStore = AuthStore()
  const snackbar = SnackbarStore()
  const tokenManager = useTokenManager()
  const { loading, submit } = useFormSubmit()

  // State declarations
  const isComplete = ref(false)
  const successMsg = ref('')

  // Handle user login
  const handleLogin = async (credentials: ILoginRequest) => {
    await submit(
      () => authProvider.login(credentials),
      {
        successMessage: 'ברוך הבא',
        onSuccess: async (user) => {
          authStore.set(user)
          if (user.authTokens) {
            tokenMemory.set(user.authTokens)
            tokenManager.initializeTokenRefresh(user.authTokens)
          }
          await router.push('/dashboard')
        },
        errorMessage: 'אימות נכשל',
      }
    )
  }

  // Handle user logout (best-effort backend revoke, always clears local session)
  const handleLogout = async () => {
    tokenManager.clearRefreshSchedule()
    await authProvider.logout()
    authStore.logout()
    await router.push('/')
  }

  // Handle user registration
  const handleRegister = async (data: IRegisterRequest) => {
    await submit(
      () => authProvider.register(data),
      {
        successMessage: 'יש להיכנס לאימייל ולאשר את הכתובת',
        onSuccess: async () => {
          isComplete.value = true
          successMsg.value = 'יש להיכנס לאימייל ולאשר את הכתובת'
          setTimeout(async () => {
            await router.push({ name: 'login' })
          }, 1500)
        },
        errorMessage: 'ההרשמה נכשלה. נא לנסות שוב.',
      }
    )
  }

  // Request password reset
  const handleRestore = async (email: string) => {
    if (!email) return
    await submit(
      () => authProvider.forgotPassword(email),
      {
        successMessage: 'קוד שחזור נשלח לאימייל שלך',
        onSuccess: async () => {
          await router.push({
            name: 'confirm-password',
            query: { email },
          })
        },
        errorMessage: 'שגיאה בשליחת הקוד',
      }
    )
  }

  // Confirm password reset
  const handleConfirmRestore = async (email: string, code: string, password: string) => {
    if (!email) {
      snackbar.open('שגיאה: אימייל חסר', 'error')
      return
    }
    await submit(
      () => authProvider.confirmForgotPassword(email, code, password),
      {
        successMessage: 'הסיסמה עודכנה בהצלחה!',
        onSuccess: async () => {
          await router.push('/dashboard/login')
        },
        errorMessage: 'אימות נכשל',
      }
    )
  }

  return {
    loading,
    isComplete,
    successMsg,
    handleLogin,
    handleLogout,
    handleRegister,
    handleRestore,
    handleConfirmRestore,
  }
}
