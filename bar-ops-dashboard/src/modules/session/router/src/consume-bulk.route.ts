import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: ':clientId/:id/bulk',
  name: 'consume-bulk',
  component: () => import('@consume/views/ConsumeBulkView.vue'),
  props: (route) => ({
    initialTypes: route.query.types ? route.query.types.toString().split(',') : [],
  }),
  meta: {
    title: 'עדכון צריכה באירוע',
    description: 'עדכון מרוכז של הפריטים שנצרכו באירוע.',
  },
}

export default route
