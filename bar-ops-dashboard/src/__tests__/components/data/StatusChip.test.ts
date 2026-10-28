import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusChip from '../../../modules/shared/components/data/StatusChip.vue'

describe('StatusChip Component', () => {
  const sampleMeta = {
    label: 'פעיל',
    color: 'success',
    icon: 'mdi-check-circle',
  }

  it('renders label and icon correctly', () => {
    const wrapper = mount(StatusChip, {
      props: {
        meta: sampleMeta,
      },
    })
    expect(wrapper.text()).toContain('פעיל')
    expect(wrapper.find('.v-icon').exists()).toBe(true)
  })

  it('passes size and variant props correctly', () => {
    const wrapper = mount(StatusChip, {
      props: {
        meta: sampleMeta,
        size: 'x-small',
        variant: 'tonal',
      },
    })
    // Check custom props are accepted
    expect(wrapper.props('size')).toBe('x-small')
    expect(wrapper.props('variant')).toBe('tonal')
  })
})
