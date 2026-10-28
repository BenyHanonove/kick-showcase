import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SummaryPanel from '../../../modules/shared/components/layout/SummaryPanel.vue'
import type { ISummaryMetric } from '../../../modules/shared/types/ISummaryMetric.types'

const metrics: ISummaryMetric[] = [
  { key: 'income', label: 'הכנסה', value: 1000, icon: 'mdi-cash-plus', tone: 'positive' },
  { key: 'cost', label: 'עלות', value: 400, icon: 'mdi-cash-minus', tone: 'negative' },
  { key: 'profit', label: 'רווח', value: 600, icon: 'mdi-trending-up', tone: 'net' },
]

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(SummaryPanel, {
    props: { title: 'סיכום כספי', icon: 'mdi-trending-up', ...props },
  })

describe('SummaryPanel Component', () => {
  it('renders the title and every metric', () => {
    const wrapper = mountPanel({ metrics })
    expect(wrapper.text()).toContain('סיכום כספי')
    expect(wrapper.text()).toContain('הכנסה')
    expect(wrapper.text()).toContain('₪1,000.00')
    expect(wrapper.text()).toContain('₪600.00')
  })

  it('stays expanded and shows no chevron when not collapsible', () => {
    const wrapper = mountPanel({ metrics })
    expect(wrapper.find('[role="button"]').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('mdi-chevron-down')
  })

  it('starts collapsed and exposes a toggle when collapsible', async () => {
    const wrapper = mountPanel({ metrics, collapsible: true })
    const header = wrapper.find('[role="button"]')
    expect(header.exists()).toBe(true)
    expect(header.attributes('aria-expanded')).toBe('false')

    await header.trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
  })

  it('honours the open model from the parent', () => {
    const wrapper = mountPanel({ metrics, collapsible: true, open: true })
    expect(wrapper.find('[role="button"]').attributes('aria-expanded')).toBe('true')
  })

  it('toggles on keyboard activation', async () => {
    const wrapper = mountPanel({ metrics, collapsible: true })
    await wrapper.find('[role="button"]').trigger('keydown.enter')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
  })

  it('resolves a negative net metric to the error tone', () => {
    const wrapper = mountPanel({
      metrics: [{ key: 'net', label: 'רווח', value: -50, icon: 'mdi-trending-down', tone: 'net' }],
    })
    expect(wrapper.html()).toContain('text-error')
  })

  it('resolves a positive net metric to the success tone', () => {
    const wrapper = mountPanel({
      metrics: [{ key: 'net', label: 'רווח', value: 50, icon: 'mdi-trending-up', tone: 'net' }],
    })
    expect(wrapper.html()).toContain('text-success')
  })

  it('renders a distribution bar when segments are supplied', () => {
    const wrapper = mountPanel({
      segments: [
        { label: 'עלות', value: 40, color: 'bg-error' },
        { label: 'רווח', value: 60, color: 'bg-success' },
      ],
    })
    expect(wrapper.text()).toContain('עלות (40%)')
    expect(wrapper.text()).toContain('רווח (60%)')
  })

  it('formats values according to the declared format', () => {
    const wrapper = mountPanel({
      metrics: [
        { key: 'qty', label: 'כמות', value: 12, icon: 'mdi-numeric', tone: 'neutral', format: 'number' },
        { key: 'margin', label: 'מרווח', value: 35, icon: 'mdi-percent', tone: 'neutral', format: 'percent' },
      ],
    })
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('35%')
  })
})
