import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '',
  name: 'suppliers',
  component: () => import('@supplier/views/SuppliersView.vue'),
  meta: {
    title: 'ספקים',
    description: 'ניהול ספקי KICK: פרטי קשר, מוצרים ורכש למלאי.',
  },
}

export default route
