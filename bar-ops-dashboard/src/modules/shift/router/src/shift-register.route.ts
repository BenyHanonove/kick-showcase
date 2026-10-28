import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/shift-register',
  // The approved WhatsApp template button points at /session/self-assign?token=,
  // so that path must resolve here too, alongside the legacy /shifts/register.
  alias: ['/shifts/register', '/session/self-assign'],
  name: 'shift-register',
  component: () => import('@shift/views/ShiftRegisterView.vue'),
  meta: {
    isPublic: true,
    title: 'הרשמה למשמרת – KICK',
    description: 'אישור זמינות והרשמה למשמרת באירוע הקרוב של KICK.',
  },
}

export default route
