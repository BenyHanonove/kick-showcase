import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '',
  name: 'clients',
  component: () => import('@client/views/ClientView.vue'),
  meta: {
    title: 'לקוחות',
    description: 'ניהול לקוחות KICK: פרטי קשר, אירועים ומכירות.',
  },
}

export default route
