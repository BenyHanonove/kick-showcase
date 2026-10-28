import type { RouteRecordRaw } from 'vue-router'
import { ProductType } from '@product/types/ProductType.types'

const route: RouteRecordRaw = {
  path: 'menu',
  name: 'products-menu',
  component: () => import('@product/views/ProductsMenu.vue'),
  props: {
    allowedTypes: [
      ProductType.ALCOHOL,
      ProductType.SODA,
      ProductType.ENERGY_DRINK,
      ProductType.ACCOMPANYING,
      ProductType.EQUIPMENT,
      ProductType.DISPOSABLE,
    ],
  },
  meta: {
    title: 'תפריט מוצרים',
    description: 'תפריט המוצרים של KICK הזמינים לאירועים ולהזמנות.',
  },
}

export default route
