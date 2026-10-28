import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppList from '../../../modules/shared/components/layout/AppList.vue'

describe('AppList Component', () => {
  it('renders actions and dividers correctly', () => {
    let clicked = false
    const sampleActions = [
      [
        {
          title: 'אפשרות א',
          icon: 'mdi-plus',
          handler: () => {
            clicked = true
          },
        },
      ],
      [
        {
          title: 'אפשרות ב',
          icon: 'mdi-delete',
          color: 'error',
          handler: () => {},
        },
      ],
    ]

    const wrapper = mount(AppList, {
      props: {
        actions: sampleActions,
      },
    })

    expect(wrapper.text()).toContain('אפשרות א')
    expect(wrapper.text()).toContain('אפשרות ב')
    expect(wrapper.find('.v-divider').exists()).toBe(true)

    // Trigger click on first action
    wrapper.findAll('.v-list-item')[0].trigger('click')
    expect(clicked).toBe(true)
  })
})
