import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: ':clientId/:id/shift-hourly-rates',
  name: 'shift-hourly-rates',
  component: () => import('@shift/views/ShiftHourlyRatesView.vue'),
  meta: {
    title: 'עדכון שעתי למשמרות',
    description: 'עדכון תעריפים שעתיים לברמנים המשובצים למשמרות האירוע.',
  },
}

export default route
