import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SummaryBreakdown from '../../../modules/shared/components/data/SummaryBreakdown.vue'
import type {
  ISummaryColumn,
  ISummaryRow,
} from '../../../modules/shared/types/ISummaryMetric.types'

const columns: ISummaryColumn[] = [
  { key: 'qty', label: 'כמות', align: 'center', format: 'number' },
  { key: 'income', label: 'הכנסה', format: 'currency', tone: 'positive' },
  { key: 'profit', label: 'רווח', format: 'currency', tone: 'net' },
]

const rows: ISummaryRow[] = [
  { key: 'alcohol', label: 'אלכוהול', icon: 'mdi-bottle-wine', values: { qty: 10, income: 500, profit: 200 } },
  { key: 'soda', label: 'משקאות', icon: 'mdi-cup', values: { qty: 4, income: 100, profit: -20 } },
]

describe('SummaryBreakdown Component', () => {
  it('renders every column header and row', () => {
    const wrapper = mount(SummaryBreakdown, { props: { columns, rows } })
    expect(wrapper.text()).toContain('כמות')
    expect(wrapper.text()).toContain('אלכוהול')
    expect(wrapper.text()).toContain('₪500.00')
    expect(wrapper.text()).toContain('10')
  })

  it('renders a totals footer only when totals are supplied', () => {
    const without = mount(SummaryBreakdown, { props: { columns, rows } })
    expect(without.find('tfoot').exists()).toBe(false)

    const withTotals = mount(SummaryBreakdown, {
      props: { columns, rows, totals: { qty: 14, income: 600, profit: 180 } },
    })
    expect(withTotals.find('tfoot').exists()).toBe(true)
    expect(withTotals.find('tfoot').text()).toContain('₪600.00')
  })

  it('colours a net cell by the sign of its value', () => {
    const wrapper = mount(SummaryBreakdown, { props: { columns, rows } })
    const cells = wrapper.findAll('tbody td')
    expect(cells.some((c) => c.classes().includes('text-success'))).toBe(true)
    expect(cells.some((c) => c.classes().includes('text-error'))).toBe(true)
  })

  it('falls back to zero for a missing row value', () => {
    const wrapper = mount(SummaryBreakdown, {
      props: { columns, rows: [{ key: 'x', label: 'ריק', values: { qty: 1 } }] },
    })
    expect(wrapper.text()).toContain('₪0.00')
  })

  it('renders the optional title and custom labels', () => {
    const wrapper = mount(SummaryBreakdown, {
      props: { columns, rows, title: 'פירוט לפי קטגוריה', rowLabel: 'סוג' },
    })
    expect(wrapper.text()).toContain('פירוט לפי קטגוריה')
    expect(wrapper.text()).toContain('סוג')
  })
})
