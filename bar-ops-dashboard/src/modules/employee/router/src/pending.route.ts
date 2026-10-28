import type { RouteRecordRaw } from 'vue-router'

import { UserRole } from '@auth/types/IUser.types'

const route: RouteRecordRaw = {
  path: 'pending',
  name: 'pending-list',
  component: () => import('@employee/views/PendingListView.vue'),
  meta: {
    title: 'רשימת ממתינים',
    description: 'אישור או דחייה של מועמדים שנרשמו וממתינים לצירוף לצוות KICK.',
    minRole: UserRole.ADMIN,
  },
}

export default route
