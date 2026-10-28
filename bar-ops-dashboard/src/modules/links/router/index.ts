import type { RouteRecordRaw } from 'vue-router'
import linkTreeRoute from './src/link-tree.route'

// Single public hub page — no AppLayout chrome, no auth
const linksRoutes: RouteRecordRaw[] = [linkTreeRoute]

export default linksRoutes
