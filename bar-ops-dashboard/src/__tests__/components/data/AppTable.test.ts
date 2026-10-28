import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTable from '../../../modules/shared/components/data/AppTable.vue'

describe('AppTable Component', () => {
  const sampleHeaders = [
    { key: 'name', label: 'שם' },
    { key: 'role', label: 'תפקיד' },
  ]
  const sampleItems = [
    { id: 1, name: 'אלי', role: 'ברמן' },
    { id: 2, name: 'דנה', role: 'מלצרית' },
  ]

  it('renders loading state correctly', () => {
    const wrapper = mount(AppTable, {
      props: {
        items: [],
        headers: sampleHeaders,
        loading: true,
      },
    })
    expect(wrapper.find('.v-progress-circular').exists()).toBe(true)
  })

  it('renders empty state when no items', () => {
    const wrapper = mount(AppTable, {
      props: {
        items: [],
        headers: sampleHeaders,
        emptyFeature: 'ספקים',
      },
    })
    expect(wrapper.text()).toContain('אין רשומות של ספקים')
  })

  it('renders headers and items correctly', () => {
    const wrapper = mount(AppTable, {
      props: {
        items: sampleItems,
        headers: sampleHeaders,
      },
    })
    expect(wrapper.text()).toContain('שם')
    expect(wrapper.text()).toContain('תפקיד')
    expect(wrapper.text()).toContain('אלי')
    expect(wrapper.text()).toContain('דנה')
  })
})
