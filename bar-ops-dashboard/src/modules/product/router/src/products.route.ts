import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '',
  name: 'products',
  component: () => import('@product/views/ProductsView.vue'),
  meta: {
    title: 'מוצרים',
    description: 'ניהול קטלוג המוצרים של KICK: אלכוהול, משקאות, ציוד ומתכלים.',
  },
}

export default route
