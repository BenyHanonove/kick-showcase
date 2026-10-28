import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import * as components from 'vuetify/components'
import { vuetify } from '../config/theme'
import { shadow, elevation } from '../config/theme/tokens'

describe('Theme Vuetify Defaults Configuration', () => {
  describe('VCard Defaults', () => {
    it('should apply rounded=lg and shadow-card to VCard', () => {
      const wrapper = mount(
        {
          template: '<VCard>Card Content</VCard>',
          components: { VCard: components.VCard },
        },
        {
          global: {
            plugins: [vuetify],
          },
        }
      )

      const card = wrapper.findComponent(components.VCard)
      expect(card.classes()).toContain('rounded-lg')
      expect(card.classes()).toContain('shadow-card')
    })

    it('should allow overriding VCard defaults with props', () => {
      const wrapper = mount(
        {
          template: '<VCard rounded="0" :elevation="2">Card Content</VCard>',
          components: { VCard: components.VCard },
        },
        {
          global: {
            plugins: [vuetify],
          },
        }
      )

      const card = wrapper.findComponent(components.VCard)
      expect(card.classes()).not.toContain('rounded-lg')
      expect(card.classes()).toContain('elevation-2')
    })
  })

  describe('VButton Defaults', () => {
    it('should apply rounded=lg to VBtn', () => {
      const wrapper = mount(
        {
          template: '<VBtn>Button</VBtn>',
          components: { VBtn: components.VBtn },
        },
        {
          global: {
            plugins: [vuetify],
          },
        }
      )

      const btn = wrapper.findComponent(components.VBtn)
      expect(btn.classes()).toContain('rounded-lg')
    })
  })

  describe('VDialog Defaults', () => {
    it('should apply shadow-popover class to the open dialog overlay', async () => {
      const wrapper = mount(
        {
          template: '<VDialog v-model="open">Dialog Content</VDialog>',
          components: { VDialog: components.VDialog },
          data() {
            return { open: true }
          },
        },
        {
          attachTo: document.body,
          global: {
            plugins: [vuetify],
          },
        }
      )

      await wrapper.vm.$nextTick()
      const overlay = document.querySelector('.v-overlay')
      expect(overlay?.classList.contains('shadow-popover')).toBe(true)
      wrapper.unmount()
    })

    it('should use semantic elevation (modal=3)', () => {
      expect(elevation.modal).toBe(3)
    })
  })

  describe('VDataTable Defaults', () => {
    it('should apply density=comfortable to VDataTable', () => {
      const wrapper = mount(
        {
          template: '<VDataTable :items="[]" :headers="[]"></VDataTable>',
          components: { VDataTable: components.VDataTable },
        },
        {
          global: {
            plugins: [vuetify],
          },
        }
      )

      const table = wrapper.findComponent(components.VDataTable)
      expect(table.classes()).toContain('v-table--density-comfortable')
    })
  })

  describe('VList Defaults', () => {
    it('should apply density=comfortable to VList', () => {
      const wrapper = mount(
        {
          template: '<VList></VList>',
          components: { VList: components.VList },
        },
        {
          global: {
            plugins: [vuetify],
          },
        }
      )

      const list = wrapper.findComponent(components.VList)
      expect(list.classes()).toContain('v-list--density-comfortable')
    })
  })

  describe('Token-Based Values', () => {
    it('should define shadow.card token', () => {
      expect(shadow.card).toBeTruthy()
      expect(shadow.card).toContain('rgba')
    })

    it('should define shadow.popover token', () => {
      expect(shadow.popover).toBeTruthy()
      expect(shadow.popover).toContain('rgba')
    })

    it('should use semantic elevation levels', () => {
      expect(elevation.raised).toBe(1)
      expect(elevation.modal).toBe(3)
    })

    it('should use no hardcoded px values in elevation config', () => {
      expect(typeof elevation.base).toBe('number')
      expect(typeof elevation.raised).toBe('number')
      expect(typeof elevation.modal).toBe('number')
    })
  })

  describe('CSS Shadow Classes', () => {
    it('should have shadow-card class defined with the token box-shadow value', () => {
      const probe = document.createElement('div')
      probe.className = 'shadow-card'
      document.body.appendChild(probe)
      expect(getComputedStyle(probe).boxShadow).not.toBe('')
      document.body.removeChild(probe)
    })
  })
})
