import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockProductsStore, mockSuppliersStore } = vi.hoisted(() => ({
  mockProductsStore: {
    get: (id: string) => ({
      id,
      name: 'Product 1',
      type: 'alcohol',
      price: 100,
      supplierId: 'sup1',
    }),
  },
  mockSuppliersStore: {
    get: (id: string) => ({ id, name: 'Supplier 1' }),
  },
}))

vi.mock('@stores', () => ({
  ProductsStore: () => mockProductsStore,
  SuppliersStore: () => mockSuppliersStore,
}))

vi.mock('@auth/components/AuthWrapper.vue', () => ({
  default: { name: 'AuthWrapper', template: '<div><slot /></div>' },
}))

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ConsumeRow from '@consume/components/ConsumeRow.vue'
import type { IConsume } from '@consume/types/IConsume.types'

const consume: IConsume = {
  id: '1',
  productId: 'p1',
  sessionId: 's1',
  chargedPrice: 100,
  supplierPrice: 100,
  target: 10,
  order: 8,
  arrived: 6,
  fromStorage: 5,
  creditedToSupplier: 2,
  returnedToStorage: 1,
  timestamp: 'ts1',
}

const mountRow = () =>
  mount(ConsumeRow, {
    props: { consume },
    global: {
      stubs: {
        InitialsAvatar: { template: '<div><slot /></div>' },
        AppButton: { template: '<button />' },
        AppList: { template: '<div />' },
        'v-card': { template: '<div><slot /></div>' },
        'v-card-text': { template: '<div><slot /></div>' },
        'v-row': { template: '<div><slot /></div>' },
        'v-col': { template: '<div><slot /></div>' },
        'v-avatar': { template: '<div><slot /></div>' },
        'v-icon': { template: '<i><slot /></i>' },
        'v-tooltip': { template: '<div><slot /></div>' },
        'v-menu': { template: '<div><slot /></div>' },
      },
    },
  })

// Open the inline editor on a cube and type a new value
const editCube = async (wrapper: ReturnType<typeof mountRow>, cubeClass: string, value: string) => {
  await wrapper.find(`.${cubeClass}`).trigger('click')
  const input = wrapper.find(`.${cubeClass} input`)
  await input.setValue(value)
  return input
}

describe('ConsumeRow inline cube editing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('emits quick-update when the input loses focus (click outside)', async () => {
    const wrapper = mountRow()
    const input = await editCube(wrapper, 'cube-order', '15')

    await input.trigger('blur')
    await nextTick()

    expect(wrapper.emitted('quick-update')).toHaveLength(1)
    expect(wrapper.emitted('quick-update')![0][0]).toEqual({
      consume,
      field: 'order',
      value: 15,
    })
  })

  it('emits quick-update on Enter', async () => {
    const wrapper = mountRow()
    const input = await editCube(wrapper, 'cube-target', '20')

    await input.trigger('keydown.enter')
    await nextTick()

    expect(wrapper.emitted('quick-update')).toHaveLength(1)
    expect(wrapper.emitted('quick-update')![0][0]).toMatchObject({ field: 'target', value: 20 })
  })

  it('discards the edit on Escape', async () => {
    const wrapper = mountRow()
    const input = await editCube(wrapper, 'cube-order', '15')

    await input.trigger('keydown.esc')
    await nextTick()

    expect(wrapper.emitted('quick-update')).toBeUndefined()
  })

  it('does not emit when the value is unchanged, blank or negative', async () => {
    for (const value of [String(consume.order), '', '-3']) {
      const wrapper = mountRow()
      const input = await editCube(wrapper, 'cube-order', value)
      await input.trigger('blur')
      await nextTick()

      expect(wrapper.emitted('quick-update')).toBeUndefined()
    }
  })

  it('does not open an editor on derived cubes', async () => {
    const wrapper = mountRow()

    for (const cubeClass of ['cube-leftover', 'cube-consumed']) {
      await wrapper.find(`.${cubeClass}`).trigger('click')
      expect(wrapper.find(`.${cubeClass} input`).exists()).toBe(false)
    }
  })
})
