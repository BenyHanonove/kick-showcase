import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '',
  name: 'storage',
  component: () => import('@product/views/StorageView.vue'),
  meta: {
    title: 'מלאי מחסן',
    description: 'מעקב אחר כמויות המלאי במחסן KICK וניהול חוסרים.',
  },
}

export default route
