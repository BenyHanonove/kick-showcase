import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@auth/types/IUser.types'

const route: RouteRecordRaw = {
  path: ':clientId/:id/shift-arrivals',
  name: 'shift-arrivals',
  component: () => import('@shift/views/ShiftArrivalsView.vue'),
  meta: {
    title: 'לוח הגעות',
    description: 'מי מגיע ומתי: שעות ההגעה של כל הצוות המשובץ לאירוע.',
    minRole: UserRole.MANAGER,
  },
}

export default route
