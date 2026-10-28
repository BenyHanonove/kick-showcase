import type { RouteRecordRaw } from 'vue-router'

import { UserRole } from '@auth/types/IUser.types'

const route: RouteRecordRaw = {
  path: 'rate',
  name: 'employee-rate',
  component: () => import('@employee/views/EmployeeRateView.vue'),
  meta: {
    title: 'דרג עובדים',
    description: 'דירוג רמת העובדים המאושרים בצוות KICK.',
    minRole: UserRole.ADMIN,
  },
}

export default route
