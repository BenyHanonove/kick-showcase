import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: ':clientId/:id',
  name: 'session-details',
  component: () => import('@session/views/SessionManagementView.vue'),
  meta: {
    title: 'ניהול אירוע',
    description: 'ניהול אירוע: משמרות, מלאי, צריכה וסגירת האירוע.',
  },
}

export default route
