import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '',
  name: 'sales-list',
  component: () => import('@sale/views/SalesView.vue'),
  meta: {
    title: 'מכירות',
    description: 'ניהול מכירות KICK ומעקב אחר סטטוס, פריטים ותשלומים.',
  },
}

export default route
