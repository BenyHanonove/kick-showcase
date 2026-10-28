import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/dashboard/restore',
  name: 'restore',
  component: () => import('@auth/views/RestorePasswordView.vue'),
  alias: ['/dashboard/auth/restore'],
  meta: {
    isPublic: true,
    title: 'שחזור סיסמה – KICK',
    description: 'שכחתם סיסמה? שלחו קוד אימות ואפסו את הסיסמה לחשבון KICK שלכם.',
  },
}

export default route
