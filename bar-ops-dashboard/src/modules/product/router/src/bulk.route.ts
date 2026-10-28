import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'bulk',
  name: 'storage-bulk',
  component: () => import('@product/views/StorageBulkView.vue'),
  meta: {
    title: 'עדכון מלאי מהיר',
    description: 'עדכון מרוכז ומהיר של כמויות המלאי במחסן KICK.',
  },
}

export default route
