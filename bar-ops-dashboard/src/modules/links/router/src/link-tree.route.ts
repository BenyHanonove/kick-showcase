import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/links',
  name: 'link-tree',
  component: () => import('@links/views/LinkTreeView.vue'),
  meta: {
    isPublic: true,
    title: 'KICK 🍸 — הבית שלנו',
    description: 'רוצים לעבוד איתנו או לסגור אירוע? כל הקישורים של KICK במקום אחד.',
  },
}

export default route
