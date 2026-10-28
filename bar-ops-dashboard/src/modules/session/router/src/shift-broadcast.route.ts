import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: ':clientId/:id/shift-broadcast',
  name: 'shift-broadcast',
  component: () => import('@shift/views/ShiftBroadcastView.vue'),
  meta: {
    title: 'שידור תזמונים למשמרות',
    description: 'שליחת תבנית השיבוץ לכל הברמנים המשובצים למשמרות האירוע.',
  },
}

export default route
