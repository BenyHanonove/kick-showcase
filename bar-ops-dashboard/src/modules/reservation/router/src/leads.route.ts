import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '',
  name: 'leads',
  component: () => import('@reservation/views/LeadsView.vue'),
  meta: {
    title: 'לידים',
    description: 'מעקב אחר פניות חדשות שהתקבלו מטופס הזמנת בר לאירוע.',
  },
}

export default route
