import type { RouteRecordRaw } from 'vue-router'
import productsRoute from './src/products.route'
import menuRoute from './src/menu.route'
import storageRoute from './src/storage.route'
import bulkRoute from './src/bulk.route'

const productRoutes: RouteRecordRaw[] = [
  {
    path: '/products',
    component: () => import('@shared/components/layout/AppLayout.vue'),
    meta: { isPublic: false },
    children: [productsRoute, menuRoute],
  },
  {
    path: '/storage',
    component: () => import('@shared/components/layout/AppLayout.vue'),
    meta: { isPublic: false },
    children: [storageRoute, bulkRoute],
  },
]

export default productRoutes
