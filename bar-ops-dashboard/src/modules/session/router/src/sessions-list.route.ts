import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '',
  name: 'sessions-list',
  component: () => import('@session/views/SessionsView.vue'),
  meta: {
    title: 'אירועים',
    description: 'ניהול אירועי KICK: מועדים, לקוחות, צוותים וסטטוס.',
  },
}

export default route
