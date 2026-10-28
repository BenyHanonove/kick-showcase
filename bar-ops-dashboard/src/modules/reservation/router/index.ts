import type { RouteRecordRaw } from 'vue-router'
import reservationRoute from './src/reservation.route'
import leadsRoute from './src/leads.route'

const reservationRoutes: RouteRecordRaw[] = [
  reservationRoute,
  {
    path: '/leads',
    component: () => import('@shared/components/layout/AppLayout.vue'),
    meta: { isPublic: false },
    children: [leadsRoute],
  },
]

export default reservationRoutes
