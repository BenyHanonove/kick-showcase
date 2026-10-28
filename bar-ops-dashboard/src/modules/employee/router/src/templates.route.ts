import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'templates',
  name: 'employee-templates',
  component: () => import('@employee/views/EmployeeTemplatesView.vue'),
  meta: {
    title: 'תבניות הודעות WhatsApp',
    description: 'תצוגה מקדימה של התבניות המאושרות שנשלחות לעובדי KICK.',
  },
}

export default route
