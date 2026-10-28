import type { RouteRecordRaw } from 'vue-router'
import clientsRoute from './src/clients.route'

const clientRoutes: RouteRecordRaw[] = [
  {
    path: '/clients',
    component: () => import('@shared/components/layout/AppLayout.vue'),
    meta: { isPublic: false },
    children: [clientsRoute],
  },
]

export default clientRoutes
