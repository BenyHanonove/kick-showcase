import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import AppFooter from '@shared/components/layout/AppFooter.vue'
import { VIcon } from 'vuetify/components'

describe('AppFooter Component', () => {
  const mountFooter = () => {
    return mount(AppFooter, {
      global: {
        components: { VIcon },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    })
  }

  it('renders both row 1 (main items) and row 2 (copyright)', () => {
    const wrapper = mountFooter()
    expect(wrapper.find('.app-foot-row-main').exists()).toBe(true)
    expect(wrapper.find('.app-foot-row-copy').exists()).toBe(true)
  })

  it('does not render the brand logo', () => {
    const wrapper = mountFooter()
    expect(wrapper.find('.app-foot-logo').exists()).toBe(false)
  })

  it('does not render quick navigation chips', () => {
    const wrapper = mountFooter()
    expect(wrapper.find('.app-foot-routes').exists()).toBe(false)
  })

  it('renders all three legal links with correct destinations', () => {
    const wrapper = mountFooter()
    const legalLinks = wrapper.find('.app-foot-links').findAllComponents(RouterLinkStub)

    expect(legalLinks.length).toBe(3)
    expect(legalLinks[0].props('to')).toBe('/terms')
    expect(legalLinks[0].text()).toBe('תנאי שימוש')

    expect(legalLinks[1].props('to')).toBe('/privacy-policy')
    expect(legalLinks[1].text()).toBe('מדיניות פרטיות')

    expect(legalLinks[2].props('to')).toBe('/accessibility')
    expect(legalLinks[2].text()).toBe('הצהרת נגישות')
  })

  it('renders social media links with secure attributes', () => {
    const wrapper = mountFooter()
    const instagram = wrapper.find('a[aria-label="Instagram"]')
    const whatsapp = wrapper.find('a[aria-label="WhatsApp"]')

    expect(instagram.exists()).toBe(true)
    expect(instagram.attributes('href')).toBe('https://www.instagram.com/kick_morethanbar/')
    expect(instagram.attributes('target')).toBe('_blank')
    expect(instagram.attributes('rel')).toContain('noopener')

    expect(whatsapp.exists()).toBe(true)
    expect(whatsapp.attributes('href')).toBe('https://wa.me/972532753040')
    expect(whatsapp.attributes('target')).toBe('_blank')
    expect(whatsapp.attributes('rel')).toContain('noopener')
  })

  it('renders current year and rights reserved in row 2', () => {
    const wrapper = mountFooter()
    const currentYear = new Date().getFullYear()
    const copyright = wrapper.find('.app-foot-copy')

    expect(copyright.exists()).toBe(true)
    expect(copyright.text()).toContain(String(currentYear))
    expect(copyright.text()).toContain('KICK LTD. ALL RIGHTS RESERVED.')
  })
})
