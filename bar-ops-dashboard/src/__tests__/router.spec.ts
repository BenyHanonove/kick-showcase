import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '../config/router'
import { AuthStore } from '../modules/auth/composables/auth.store'
import { UserRole } from '../modules/auth/types/IUser.types'

// Mock app initialization to avoid network calls during router guard tests
vi.mock('@shared/composables/app-init.service', () => ({
  useAppInitialization: () => ({
    loadDashboardData: vi.fn(),
  }),
}))

describe('Router Navigation Guard', () => {
  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('When user has NO valid cookie (Unauthenticated)', () => {
    beforeEach(() => {
      const authStore = AuthStore()
      authStore.logout()
    })

    it('allows access to the landing page at "/"', async () => {
      await router.push('/')
      expect(router.currentRoute.value.path).toBe('/')
      expect(router.currentRoute.value.name).toBe('landing')
    })

    it('redirects from protected /dashboard route to the dashboard login page', async () => {
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/dashboard/login')
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('redirects from protected /dashboard/sessions route to the dashboard login page', async () => {
      await router.push('/dashboard/sessions')
      expect(router.currentRoute.value.path).toBe('/dashboard/login')
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('allows access to dashboard login route "/dashboard/login"', async () => {
      await router.push('/dashboard/login')
      expect(router.currentRoute.value.path).toBe('/dashboard/login')
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('redirects legacy "/auth/login" to "/dashboard/login"', async () => {
      await router.push('/auth/login')
      expect(router.currentRoute.value.path).toBe('/dashboard/login')
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('allows access to public legal route "/terms"', async () => {
      await router.push('/terms')
      expect(router.currentRoute.value.path).toBe('/terms')
    })
  })

  describe('When user HAS a valid cookie (Authenticated)', () => {
    beforeEach(() => {
      const authStore = AuthStore()
      authStore.set({
        email: 'test@kick.co.il',
        firstName: 'ישראל',
        lastName: 'ישראלי',
        groups: [UserRole.ADMIN],
      })
    })

    it('redirects from landing page "/" to the dashboard prefix', async () => {
      await router.push('/')
      // /dashboard automatically redirects to /dashboard/sessions
      expect(router.currentRoute.value.path).toBe('/dashboard/sessions')
    })

    it('redirects from "/dashboard/login" to the dashboard prefix', async () => {
      await router.push('/dashboard/login')
      expect(router.currentRoute.value.path).toBe('/dashboard/sessions')
    })

    it('allows access directly to /dashboard/sessions', async () => {
      await router.push('/dashboard/sessions')
      expect(router.currentRoute.value.path).toBe('/dashboard/sessions')
    })

    it('redirects legacy "/sessions/:clientId/:id" to "/dashboard/sessions/:clientId/:id"', async () => {
      await router.push('/sessions/client123/session456')
      expect(router.currentRoute.value.path).toBe('/dashboard/sessions/client123/session456')
      expect(router.currentRoute.value.name).toBe('session-details')
    })

    it('resolves named route "session-details" correctly to "/dashboard/sessions/:clientId/:id"', async () => {
      await router.push({
        name: 'session-details',
        params: { clientId: 'client123', id: 'session456' },
      })
      expect(router.currentRoute.value.path).toBe('/dashboard/sessions/client123/session456')
      expect(router.currentRoute.value.name).toBe('session-details')
    })

    it('redirects legacy "/sales/:clientId/:id" to "/dashboard/sales/:clientId/:id"', async () => {
      await router.push('/sales/client123/sale456')
      expect(router.currentRoute.value.path).toBe('/dashboard/sales/client123/sale456')
      expect(router.currentRoute.value.name).toBe('sale-details')
    })

    it('redirects legacy "/employees/pending" to "/dashboard/employees/pending"', async () => {
      await router.push('/employees/pending')
      expect(router.currentRoute.value.path).toBe('/dashboard/employees/pending')
      expect(router.currentRoute.value.name).toBe('pending-list')
    })

    it('allows access to public pages like "/privacy-policy"', async () => {
      await router.push('/privacy-policy')
      expect(router.currentRoute.value.path).toBe('/privacy-policy')
    })
  })
})
