import type { RouteRecordRaw } from 'vue-router'

// Import route children
import loginRoute from './src/login.route'
import registerRoute from './src/register.route'
import restoreRoute from './src/restore.route'
import confirmPasswordRoute from './src/confirm-password.route'

const authRoutes: RouteRecordRaw[] = [
  loginRoute,
  registerRoute,
  restoreRoute,
  confirmPasswordRoute,
]

export default authRoutes
