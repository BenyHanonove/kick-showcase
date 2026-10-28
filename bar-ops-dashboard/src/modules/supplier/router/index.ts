import type { RouteRecordRaw } from 'vue-router'
import suppliersRoute from './src/suppliers.route'

const supplierRoutes: RouteRecordRaw[] = [
  {
    path: '/suppliers',
    component: () => import('@shared/components/layout/AppLayout.vue'),
    meta: { isPublic: false },
    children: [suppliersRoute],
  },
]

export default supplierRoutes
