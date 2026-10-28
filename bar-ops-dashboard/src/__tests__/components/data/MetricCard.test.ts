import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricCard from '../../../modules/shared/components/data/MetricCard.vue'

describe('MetricCard Component', () => {
  it('renders standard props correctly', () => {
    const wrapper = mount(MetricCard, {
      props: {
        icon: 'mdi-cash',
        label: 'סה"כ הכנסות',
        value: '₪10,000',
        caption: 'מעודכן לפני דקה',
      },
    })
    expect(wrapper.text()).toContain('סה"כ הכנסות')
    expect(wrapper.text()).toContain('₪10,000')
    expect(wrapper.text()).toContain('מעודכן לפני דקה')
    expect(wrapper.find('.v-icon').exists()).toBe(true)
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(MetricCard, {
      props: {
        icon: 'mdi-cash',
        label: 'סה"כ',
        value: 100,
      },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('applies active classes based on active state and color', () => {
    const wrapper = mount(MetricCard, {
      props: {
        icon: 'mdi-cash',
        label: 'סה"כ',
        value: 100,
        active: true,
        activeColor: 'success',
      },
    })
    expect(wrapper.classes()).toContain('active-card')
    expect(wrapper.classes()).toContain('active-success')
  })
})
