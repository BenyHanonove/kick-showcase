import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Import types
import { type IUser, UserRole } from '@auth/types/IUser.types'

// Tokens never stored in Pinia; kept in memory only
import { tokenMemory } from './token.memory'

export const RoleLevel: Record<UserRole, number> = {
  [UserRole.ADMIN]: 3,
  [UserRole.MANAGER]: 2,
  [UserRole.USER]: 1,
}

// Auth store
export const AuthStore = defineStore(
  'auth',
  () => {
    // Reactive state
    const user = ref<IUser | null>(null)
    const role = ref<UserRole | null>(null)
    const loading = ref<boolean>(false)
    const error = ref<Error | null>(null)

    // Compute admin status
    const isAdmin = computed(() => {
      if (!role.value) return false
      return (RoleLevel[role.value] || 0) >= RoleLevel[UserRole.ADMIN]
    })

    // Compute manager status (Manager or above)
    const isManager = computed(() => {
      if (!role.value) return false
      return (RoleLevel[role.value] || 0) >= RoleLevel[UserRole.MANAGER]
    })

    // Derive role from groups
    const _calculateRole = (u: IUser | null): UserRole | null => {
      if (!u?.groups) return null
      if (u.groups.includes(UserRole.ADMIN)) return UserRole.ADMIN
      if (u.groups.includes(UserRole.MANAGER)) return UserRole.MANAGER
      if (u.groups.includes(UserRole.USER)) return UserRole.USER
      return null
    }

    // Set user and role (never carries token material)
    const set = (_user: IUser | null) => {
      if (!_user) {
        user.value = null
        role.value = null
        return
      }
      const { email, firstName, lastName, groups } = _user
      user.value = { email, firstName, lastName, groups }
      role.value = _calculateRole(_user)
    }

    // Loading state setter
    const setLoading = (_value: boolean) => {
      loading.value = _value
    }

    // Error state setter
    const setError = (_error: Error | null) => {
      error.value = _error
    }

    // Clear user session
    const logout = () => {
      user.value = null
      role.value = null
      tokenMemory.clear()
    }

    return {
      user,
      role,
      loading,
      error,
      isAdmin,
      isManager,
      set,
      setLoading,
      setError,
      logout,
    }
  },
  // Not persisted: session lives only for the tab's lifetime
)
