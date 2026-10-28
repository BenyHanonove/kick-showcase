import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/employees/self-register',
  alias: '/self-register',
  name: 'employee-self-register',
  component: () => import('@employee/views/SelfRegisterView.vue'),
  meta: {
    isPublic: true,
    title: 'רישום עובדים – KICK',
    description: 'הצטרפו לצוות הברמנים של KICK. מלאו את הפרטים ונחזור אליכם.',
  },
}

export default route
