import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: ':id',
  name: 'employee-details',
  component: () => import('@employee/views/EmployeeDetailView.vue'),
  meta: {
    title: 'פרטי עובד',
    description: 'צפייה ועריכה של פרטי עובד, תפקיד, תעריף והרשאות במערכת KICK.',
  },
}

export default route
