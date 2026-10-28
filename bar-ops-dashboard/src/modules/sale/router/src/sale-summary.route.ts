import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'summary',
  name: 'sale-summary',
  component: () => import('@sale/views/SaleSummaryView.vue'),
  meta: {
    title: 'סיכום מכירות לפי חודש',
    description: 'סיכום חודשי של מכירות KICK: הכנסות, כמויות ומגמות.',
  },
}

export default route
