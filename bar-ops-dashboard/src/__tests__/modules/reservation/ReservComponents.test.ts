import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReservBriefInfo from '@reservation/components/ReservBriefInfo.vue'
import ReservForm from '@reservation/components/ReservForm.vue'

describe('Reservation Components', () => {
  describe('ReservBriefInfo', () => {
    it('renders event brief headings and value highlights', () => {
      const wrapper = mount(ReservBriefInfo, {
        global: {
          stubs: {
            AppButton: {
              template: '<button @click="$emit(\'click\')"><slot /></button>',
            },
            'v-icon': true,
          },
        },
      })

      expect(wrapper.text()).toContain('EVENT BRIEF')
      expect(wrapper.text()).toContain('ספרו לנו על האירוע')
      expect(wrapper.text()).toContain('THE NUMBERS')
      expect(wrapper.text()).toContain('מענה מהיר')
      expect(wrapper.text()).toContain('מחיר סגור ושקוף')
    })

    it('emits continue event when clicking the CTA button', async () => {
      const wrapper = mount(ReservBriefInfo, {
        global: {
          stubs: {
            AppButton: {
              template: '<button class="bi-cta"><slot /></button>',
            },
            'v-icon': true,
          },
        },
      })

      const btn = wrapper.find('.bi-cta')
      expect(btn.exists()).toBe(true)
      await btn.trigger('click')

      expect(wrapper.emitted('continue')).toBeTruthy()
      expect(wrapper.emitted('continue')?.length).toBe(1)
    })
  })

  describe('ReservForm', () => {
    it('renders Step 1 initially with contact fields and stepper', () => {
      const wrapper = mount(ReservForm, {
        global: {
          stubs: {
            AppButton: true,
            AppInput: true,
            'v-form': {
              template: '<form><slot /></form>',
            },
            'v-row': { template: '<div><slot /></div>' },
            'v-col': { template: '<div><slot /></div>' },
            'v-icon': true,
            'v-checkbox': true,
            RouterLink: true,
          },
        },
      })

      expect(wrapper.text()).toContain('פרטי האירוע')
      expect(wrapper.text()).toContain('פרטי קשר')
      expect(wrapper.text()).toContain('01')
      expect(wrapper.text()).toContain('02')
    })

    it('can navigate to step 1 and step 2', async () => {
      const wrapper = mount(ReservForm, {
        global: {
          stubs: {
            AppButton: true,
            AppInput: true,
            'v-form': {
              template: '<form><slot /></form>',
            },
            'v-row': { template: '<div><slot /></div>' },
            'v-col': { template: '<div><slot /></div>' },
            'v-icon': true,
            'v-checkbox': true,
            RouterLink: true,
          },
        },
      })

      // Click step 1 tab
      const tabs = wrapper.findAll('.rf-step-tab')
      expect(tabs.length).toBe(2)
      await tabs[0].trigger('click')
      expect(wrapper.find('.rf-step-tab--active').text()).toContain('01')
    })
  })
})
