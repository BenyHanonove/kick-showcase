import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: ':clientId/:id/bulk',
  name: 'sale-consume-bulk',
  component: () => import('@consume/views/ConsumeBulkView.vue'),
  props: (route) => ({
    initialTypes: route.query.types ? route.query.types.toString().split(',') : [],
  }),
  meta: {
    title: 'עדכון צריכה במכירה',
    description: 'עדכון מרוכז של הפריטים שנצרכו במכירה.',
  },
}

export default route
