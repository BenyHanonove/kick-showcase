import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '',
  name: 'employees',
  component: () => import('@employee/views/EmployeesView.vue'),
  meta: {
    title: 'עובדים',
    description: 'ניהול צוות הברמנים של KICK: פרטי עובדים, תפקידים והרשאות.',
  },
}

export default route
