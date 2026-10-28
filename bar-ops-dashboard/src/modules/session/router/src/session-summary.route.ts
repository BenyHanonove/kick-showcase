import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: ':clientId/:id/summary',
  name: 'session-summary',
  component: () => import('@session/views/SessionSummaryView.vue'),
  meta: {
    title: 'סיכום אירוע',
    description: 'סיכום האירוע: צריכה, עלויות, שעות ותשלומים לצוות.',
  },
}

export default route
