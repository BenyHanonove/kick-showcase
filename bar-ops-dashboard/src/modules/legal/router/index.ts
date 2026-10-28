import type { RouteRecordRaw } from 'vue-router'
import privacyPolicyRoute from './src/privacy-policy.route'
import accessibilityRoute from './src/accessibility.route'
import termsRoute from './src/terms.route'

const legalRoutes: RouteRecordRaw[] = [
  privacyPolicyRoute,
  accessibilityRoute,
  termsRoute,
]

export default legalRoutes
