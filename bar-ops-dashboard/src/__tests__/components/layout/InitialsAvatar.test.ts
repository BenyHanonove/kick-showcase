import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InitialsAvatar from '../../../modules/shared/components/layout/InitialsAvatar.vue'

describe('InitialsAvatar Component', () => {
  it('correctly calculates initials from single word', () => {
    const wrapper = mount(InitialsAvatar, {
      props: {
        name: 'Coca',
      },
    })
    expect(wrapper.text()).toBe('CO')
  })

  it('correctly calculates initials from multiple words', () => {
    const wrapper = mount(InitialsAvatar, {
      props: {
        name: 'Coca Cola',
      },
    })
    expect(wrapper.text()).toBe('CC')
  })

  it('handles spaces and casing', () => {
    const wrapper = mount(InitialsAvatar, {
      props: {
        name: '   pepsi max  ',
      },
    })
    expect(wrapper.text()).toBe('PM')
  })
})
