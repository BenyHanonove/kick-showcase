import type { UserRole } from '@auth/types/IUser.types'

export interface PageHeaderAction {
  label: string
  action: () => void
  icon?: string
  color?: string
  variant?: 'flat' | 'text' | 'elevated' | 'outlined' | 'plain' | 'tonal'
  minRole?: UserRole
  disabled?: boolean
}
