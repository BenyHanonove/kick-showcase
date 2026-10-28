import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: ':clientId/:id',
  name: 'sale-details',
  component: () => import('@sale/views/SaleManagementView.vue'),
  meta: {
    title: 'ניהול מכירה',
    description: 'ניהול מכירה: פריטים, כמויות, תמחור וסגירת חשבון.',
  },
}

export default route
