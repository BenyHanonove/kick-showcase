// Import Vue Router dependency and types
import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'

// Import application stores and initialization services
import { AuthStore, RoleLevel, WebSocketStore } from '@stores'
import { useAppInitialization } from '@shared/composables/app-init.service'

// Import types
import { UserRole } from '@auth/types/IUser.types'

// Route meta contract consumed by the navigation guard below
declare module 'vue-router' {
  interface RouteMeta {
    isPublic?: boolean
    title?: string
    description?: string
    image?: string
    minRole?: UserRole
  }
}

// Defaults mirror the static tags in index.html so navigating off a route that
// overrides them restores the global KICK title/description.
const DEFAULT_TITLE = 'KICK שירותי בר'
const DEFAULT_DESCRIPTION =
  'KICK - החברה הגדולה בישראל לשירותי בר לאירועים והפקות. צוותי ברמנים מקצועיים, ציוד מלא ושירות מקצה לקצה.'

// Global preview image shared by every page; meta.image overrides it per route
const DEFAULT_IMAGE = 'https://kicks.ltd/og-image.png'

// Write a head tag's content, keyed by the attribute it is declared with
function setMetaContent(selector: string, content: string) {
  const tag = document.querySelector(`meta[${selector}]`)
  if (tag) tag.setAttribute('content', content)
}

// Reflect a route's meta.title / meta.description / meta.image into the document.
// The link-preview cards (og:/twitter:) are handled at the edge for crawlers; this
// only updates what a live, JS-executing browser tab shows.
function applyRouteHead(to: RouteLocationNormalized) {
  const title = to.meta.title ?? DEFAULT_TITLE
  const description = to.meta.description ?? DEFAULT_DESCRIPTION
  const image = to.meta.image ?? DEFAULT_IMAGE

  document.title = title

  setMetaContent('name="description"', description)
  setMetaContent('property="og:title"', title)
  setMetaContent('property="og:description"', description)
  setMetaContent('property="og:image"', image)
  setMetaContent('property="og:image:alt"', title)
  setMetaContent('property="og:url"', window.location.href)
  setMetaContent('name="twitter:title"', title)
  setMetaContent('name="twitter:description"', description)
  setMetaContent('name="twitter:image"', image)
}

// Dynamic scan for module index.ts files
const modules = import.meta.glob<{ routes?: RouteRecordRaw[] }>('../../modules/*/index.ts', {
  eager: true,
})

// Aggregate raw routes exported by all modules
const rawModuleRoutes: RouteRecordRaw[] = []
for (const path in modules) {
  const mod = modules[path]
  if (mod && mod.routes) {
    rawModuleRoutes.push(...mod.routes)
  }
}

// Separate routes: public routes stay at the root level, dashboard routes are nested under /dashboard/
const publicRoutes: RouteRecordRaw[] = []
const dashboardRoutes: RouteRecordRaw[] = []
const legacyRedirects: RouteRecordRaw[] = []

for (const route of rawModuleRoutes) {
  // Routes explicitly prefixed under /dashboard/ (e.g. dashboard auth routes)
  if (route.path.startsWith('/dashboard')) {
    dashboardRoutes.push(route)
    continue
  }

  // Public routes (never under /dashboard/)
  const isPublicRoute =
    route.meta?.isPublic === true ||
    route.path === '/' ||
    route.path.startsWith('/links') ||
    route.path.startsWith('/terms') ||
    route.path.startsWith('/privacy') ||
    route.path.startsWith('/accessibility') ||
    route.path.startsWith('/self-') ||
    route.path.startsWith('/shift-')

  if (isPublicRoute) {
    publicRoutes.push({
      ...route,
      meta: {
        ...route.meta,
        isPublic: true,
      },
    })
  } else {
    // Protected dashboard routes (e.g. /sessions, /sales, /leads, /clients, /employees, /products, etc.)
    const cleanPath = route.path.replace(/^\//, '')
    const dashboardPath = `/dashboard/${cleanPath}`

    dashboardRoutes.push({
      ...route,
      path: dashboardPath,
    })

    // Backwards-compatibility redirect from /sessions to /dashboard/sessions (and subpaths)
    legacyRedirects.push({
      path: route.path,
      redirect: dashboardPath,
    })
    legacyRedirects.push({
      path: `${route.path}/:subPath(.*)*`,
      redirect: (to) => {
        const sub = Array.isArray(to.params.subPath)
          ? to.params.subPath.filter(Boolean).join('/')
          : to.params.subPath || ''
        return {
          path: sub ? `${dashboardPath}/${sub}` : dashboardPath,
          query: to.query,
          hash: to.hash,
        }
      },
    })
  }
}

// Loaded once per authenticated session
let appDataLoaded = false

// Define application routes
const routes: RouteRecordRaw[] = [
  // Public routes (including landing at '/')
  ...publicRoutes,

  // Dashboard root redirect
  {
    path: '/dashboard',
    redirect: { name: 'sessions-list' },
  },

  // Protected dashboard endpoints & auth routes
  ...dashboardRoutes,

  // Legacy redirects (e.g. /sessions -> /dashboard/sessions, /auth/* -> /dashboard/*)
  ...legacyRedirects,
  { path: '/auth', redirect: '/dashboard/login' },
  { path: '/auth/login', redirect: '/dashboard/login' },
  { path: '/auth/register', redirect: '/dashboard/register' },
  { path: '/auth/restore', redirect: '/dashboard/restore' },
  { path: '/auth/confirm-password', redirect: '/dashboard/confirm-password' },
  { path: '/dashboard/auth', redirect: '/dashboard/login' },

  // Fallback 404 redirect to landing page
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

// Create and configure the router instance
const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Configure global navigation guard
router.beforeEach(
  (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const authStore = AuthStore()

    // No valid session (no cookie or invalid / expired)
    if (!authStore.user) {
      appDataLoaded = false
      if (!to.meta.isPublic) {
        authStore.logout()
        return next({ name: 'login' })
      }
      return next()
    }

    // Valid cookie / authenticated session:
    // Direct user away from landing and auth entry pages to the dashboard prefix
    const isAuthPage =
      to.name === 'landing' ||
      to.path === '/' ||
      to.path.startsWith('/auth') ||
      to.name === 'login' ||
      to.name === 'register' ||
      to.name === 'restore' ||
      to.name === 'confirm-password'

    if (isAuthPage) {
      return next('/dashboard')
    }

    // Load shared stores on first authenticated navigation to a protected route
    if (!appDataLoaded && !to.meta.isPublic) {
      appDataLoaded = true
      useAppInitialization().loadDashboardData()
    }

    // Block routes demanding a higher role than the signed-in user holds
    const minRole = to.meta.minRole
    if (minRole && RoleLevel[authStore.role ?? UserRole.USER] < RoleLevel[minRole]) {
      return next({ name: 'sessions-list' })
    }

    next()
  },
)

// Reflect the active route's title/description into the document head
router.afterEach((to) => {
  applyRouteHead(to)
})

// Keep websocket room membership in sync with the active session/sale route
router.afterEach((to) => {
  if (!AuthStore().user || to.meta.isPublic) return

  const isRoomRoute =
    (to.path.startsWith('/sessions/') ||
      to.path.startsWith('/dashboard/sessions/') ||
      to.path.startsWith('/sales/') ||
      to.path.startsWith('/dashboard/sales/')) &&
    typeof to.params.id === 'string'

  WebSocketStore().setRoom(isRoomRoute ? (to.params.id as string) : null)
})

// Recover from a stale cached index.html after a deploy: when a route's lazily
// imported chunk 404s (old hash no longer on the server), reload once to fetch
// the current build. The guard key is shared with main.ts to avoid double reloads.
router.onError((error: Error) => {
  const message = error?.message ?? ''
  const isStaleChunk =
    /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(message)

  if (!isStaleChunk) return
  if (sessionStorage.getItem('stale-build-reloaded')) return

  try {
    sessionStorage.setItem('stale-build-reloaded', '1')
  } catch {
    // sessionStorage unavailable; still attempt one reload
  }
  window.location.reload()
})

// Export router instance
export default router
