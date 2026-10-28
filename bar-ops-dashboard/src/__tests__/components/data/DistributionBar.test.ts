import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DistributionBar from '../../../modules/shared/components/data/DistributionBar.vue'

describe('DistributionBar Component', () => {
  it('calculates percentages correctly', () => {
    const wrapper = mount(DistributionBar, {
      props: {
        segments: [
          { label: 'מזומן', value: 30, color: 'bg-success' },
          { label: 'אשראי', value: 70, color: 'bg-info' },
        ],
      },
    })
    expect(wrapper.text()).toContain('מזומן (30%)')
    expect(wrapper.text()).toContain('אשראי (70%)')
  })

  it('handles zero total sum gracefully', () => {
    const wrapper = mount(DistributionBar, {
      props: {
        segments: [
          { label: 'מזומן', value: 0, color: 'bg-success' },
          { label: 'אשראי', value: 0, color: 'bg-info' },
        ],
      },
    })
    // No segment should show since percent is 0
    expect(wrapper.find('[style*="width"]').exists()).toBe(false)
  })
})
