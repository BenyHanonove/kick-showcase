import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/employees/self-update',
  alias: '/self-update',
  name: 'employee-self-update',
  component: () => import('@employee/views/SelfUpdateView.vue'),
  meta: {
    isPublic: true,
    title: 'עדכון פרטים אישיים – KICK',
    description: 'עדכנו את הפרטים האישיים שלכם עבור צוות KICK.',
  },
}

export default route
