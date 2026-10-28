import type { RouteRecordRaw } from 'vue-router'
import sessionsListRoute from './src/sessions-list.route'
import sessionDetailsRoute from './src/session-details.route'
import sessionSummaryRoute from './src/session-summary.route'
import consumeBulkRoute from './src/consume-bulk.route'
import shiftHourlyRatesRoute from './src/shift-hourly-rates.route'
import shiftBroadcastRoute from './src/shift-broadcast.route'
import shiftArrivalsRoute from './src/shift-arrivals.route'

const sessionRoutes: RouteRecordRaw[] = [
  {
    path: '/sessions',
    component: () => import('@shared/components/layout/AppLayout.vue'),
    meta: { isPublic: false },
    children: [
      sessionsListRoute,
      sessionDetailsRoute,
      sessionSummaryRoute,
      consumeBulkRoute,
      shiftHourlyRatesRoute,
      shiftBroadcastRoute,
      shiftArrivalsRoute,
    ],
  },
]

export default sessionRoutes
