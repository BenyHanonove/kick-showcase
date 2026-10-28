import type { RouteRecordRaw } from 'vue-router'
import salesListRoute from './src/sales-list.route'
import saleDetailsRoute from './src/sale-details.route'
import saleConsumeBulkRoute from './src/sale-consume-bulk.route'
import saleSummaryRoute from './src/sale-summary.route'

const saleRoutes: RouteRecordRaw[] = [
  {
    path: '/sales',
    component: () => import('@shared/components/layout/AppLayout.vue'),
    meta: { isPublic: false },
    children: [salesListRoute, saleSummaryRoute, saleDetailsRoute, saleConsumeBulkRoute],
  },
]

export default saleRoutes
