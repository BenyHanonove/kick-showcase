import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const {
  mockUpdateFn,
  mockSessionStore,
  mockSaleStore,
  mockSnackbarStore,
  mockProductsStore,
  mockAuthStore,
  mockEmployeesStore,
  mockClientsStore,
  getMockConsumes,
  resetMockConsumes,
} = vi.hoisted(() => {
  let mockConsumes = [
    {
      id: '1',
      productId: 'p1',
      sessionId: 's1',
      target: 10,
      order: 10,
      arrived: 10,
      fromStorage: 5,
      returnedToStorage: 1,
      creditedToSupplier: 2,
      timestamp: 'ts1',
    },
  ]
  return {
    getMockConsumes: () => mockConsumes,
    resetMockConsumes: () => {
      mockConsumes = [
        {
          id: '1',
          productId: 'p1',
          sessionId: 's1',
          target: 10,
          order: 10,
          arrived: 10,
          fromStorage: 5,
          returnedToStorage: 1,
          creditedToSupplier: 2,
          timestamp: 'ts1',
        },
      ]
    },
    mockUpdateFn: vi.fn((id, payload) =>
      Promise.resolve({
        success: true,
        data: { id, ...payload },
        message: 'עודכן בהצלחה',
      }),
    ),
    mockSessionStore: {
      consumes: {
        get data() {
          return mockConsumes
        },
        update: vi.fn((item) => {
          const idx = mockConsumes.findIndex((c) => c.id === item.id)
          if (idx !== -1) mockConsumes[idx] = { ...mockConsumes[idx], ...item }
        }),
      },
      session: { id: 's1', clientId: 'c1' },
      shifts: { data: [] },
      expenses: { data: [] },
      tips: { data: [] },
      cashiers: { data: [] },
      missions: { data: [] },
    },
    mockSaleStore: {
      sale: null,
    },
    mockSnackbarStore: {
      open: vi.fn(),
    },
    mockProductsStore: {
      get: (id: string) => ({
        id,
        name: 'Product 1',
        type: 'alcohol',
        price: 100,
        supplierId: 'sup1',
      }),
      products: [
        { id: 'p1', name: 'Product 1', type: 'alcohol', price: 100, supplierId: 'sup1' },
      ],
    },
    mockAuthStore: {
      isManager: true,
      isAdmin: true,
    },
    mockEmployeesStore: {
      employees: [],
    },
    mockClientsStore: {
      clients: [],
      set: vi.fn(),
    },
  }
})

vi.mock('@stores', () => ({
  SessionStore: () => mockSessionStore,
  SaleStore: () => mockSaleStore,
  ProductsStore: () => mockProductsStore,
  SnackbarStore: () => mockSnackbarStore,
  AuthStore: () => mockAuthStore,
  EmployeesStore: () => mockEmployeesStore,
  ClientsStore: () => mockClientsStore,
}))

vi.mock('@consume/providers/consume.provider', () => ({
  consumeProvider: {
    update: mockUpdateFn,
    get: vi.fn(() => Promise.resolve({ success: true, data: {} })),
    list: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  },
}))

vi.mock('@session/composables/useSessionLoader', () => ({
  useSessionLoader: () => ({
    loadFullSession: () => Promise.resolve(),
    isInitialLoading: ref(false),
  }),
}))

vi.mock('@sale/composables/useSaleLoader', () => ({
  useSaleLoader: () => ({
    loadFullSale: () => Promise.resolve(),
    isInitialLoading: ref(false),
  }),
}))

let mockQueryField = 'leftovers'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { clientId: 'c1', id: 's1' },
    get query() {
      return { field: mockQueryField, types: 'all' }
    },
    path: '/sessions/c1/s1/consume-bulk',
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ConsumeBulkView from '@consume/views/ConsumeBulkView.vue'
import ConsumeBulk from '@consume/components/ConsumeBulk.vue'
import { ProductType } from '@product/types/ProductType.types'

describe('ConsumeBulkView Component', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    resetMockConsumes()
    mockQueryField = 'leftovers'
    vi.clearAllMocks()
  })

  it('renders and binds target-field and secondary-field correctly for leftovers', async () => {
    const wrapper = mount(ConsumeBulkView, {
      props: {
        initialTypes: [ProductType.ALCOHOL],
      },
      global: {
        stubs: {
          'global-loading': true,
          ConsumeBulk: {
            name: 'ConsumeBulk',
            template: '<div class="consume-bulk-stub"><slot /></div>',
            props: ['targetField', 'secondaryField', 'primaryLabel', 'secondaryLabel'],
          },
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-btn': { template: '<button><slot /></button>' },
          'v-select': { template: '<div><slot /></div>' },
        },
      },
    })

    await nextTick()

    const stub = wrapper.findComponent(ConsumeBulk)
    expect(stub.exists()).toBe(true)
    expect(stub.props('targetField')).toBe('returnedToStorage')
    expect(stub.props('secondaryField')).toBe('creditedToSupplier')
    expect(stub.props('primaryLabel')).toBe('החזרה למחסן')
    expect(stub.props('secondaryLabel')).toBe('החזרה לספק')
  })

  it('triggers handleLeftoversBulkUpdate and calls consumeProvider.update for both fields', async () => {
    const wrapper = mount(ConsumeBulkView, {
      props: {
        initialTypes: [ProductType.ALCOHOL],
      },
      global: {
        stubs: {
          'global-loading': true,
          ConsumeBulk: {
            name: 'ConsumeBulk',
            template: '<div class="consume-bulk-stub"></div>',
            props: ['targetField'],
          },
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-btn': { template: '<button><slot /></button>' },
          'v-select': { template: '<div><slot /></div>' },
        },
      },
    })

    await nextTick()

    // Simulate submission from consume-bulk with modified values
    const modifiedPayload = [
      {
        ...getMockConsumes()[0],
        returnedToStorage: 3, // modified from 1
        creditedToSupplier: 4, // modified from 2
      },
    ]

    const bulkComponent = wrapper.findComponent(ConsumeBulk)
    await bulkComponent.vm.$emit('submit', modifiedPayload)
    await nextTick()

    expect(mockUpdateFn).toHaveBeenCalledTimes(1)
    expect(mockUpdateFn).toHaveBeenCalledWith('1', {
      id: '1',
      returnedToStorage: 3,
      creditedToSupplier: 4,
      timestamp: 'ts1',
    })
    expect(mockSessionStore.consumes.update).toHaveBeenCalledTimes(1)
  })
})
