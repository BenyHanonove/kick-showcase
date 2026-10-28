import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/dashboard/confirm-password',
  name: 'confirm-password',
  component: () => import('@auth/views/ConfirmRestoreView.vue'),
  alias: ['/dashboard/auth/confirm-password'],
  meta: {
    isPublic: true,
    title: 'אישור סיסמה חדשה – KICK',
    description: 'הזינו את קוד האימות ובחרו סיסמה חדשה לחשבון KICK שלכם.',
  },
}

export default route
