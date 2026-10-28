import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/dashboard/login',
  name: 'login',
  component: () => import('@auth/views/LoginView.vue'),
  alias: ['/dashboard/auth/login'],
  meta: {
    isPublic: true,
    title: 'התחברות – KICK',
    description: 'התחברו למערכת הניהול של KICK שירותי בר.',
  },
}

export default route
