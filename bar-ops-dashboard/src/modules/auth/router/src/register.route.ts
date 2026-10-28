import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/dashboard/register',
  name: 'register',
  component: () => import('@auth/views/RegisterView.vue'),
  alias: ['/dashboard/auth/register'],
  meta: {
    isPublic: true,
    title: 'הרשמה – KICK',
    description: 'פתחו חשבון חדש במערכת הניהול של KICK שירותי בר.',
  },
}

export default route
