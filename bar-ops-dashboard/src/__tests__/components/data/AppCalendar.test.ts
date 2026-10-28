import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCalendar from '@shared/components/data/AppCalendar.vue'
import { useTheme } from 'vuetify'

interface ICalendarItem {
  id: string
  dateKey: string
  tooltip: string
  color?: string
}

interface ICalendarLegendItem {
  label: string
  color: string
}

// 2026-07-01 Wednesday: 3 leading cells + 31 days = 34
const MONTH_YEAR = '2026-07'

const mountCalendar = (
  props: Partial<{
    items: ICalendarItem[]
    legend: ICalendarLegendItem[]
    monthYear: string
    selectedDay: string | null
  }> = {},
) =>
  mount(AppCalendar, {
    props: {
      items: [],
      monthYear: MONTH_YEAR,
      selectedDay: null,
      ...props,
    },
  })

// Resolves color like the component, normalized via jsdom styles
const resolveThemeColor = (name: string) => {
  const probe = mount(
    {
      setup() {
        const theme = useTheme()
        return { color: theme.current.value.colors[name] ?? name }
      },
      template: '<div :style="{ backgroundColor: color }" />',
    },
    {},
  )
  return probe.attributes('style')
}

describe('AppCalendar Component', () => {
  describe('Month grid', () => {
    it('renders one cell per day plus leading empty cells for the month start weekday', () => {
      const wrapper = mountCalendar()

      expect(wrapper.findAll('.calendar-cell')).toHaveLength(34)
      expect(wrapper.findAll('.calendar-cell--empty')).toHaveLength(3)
    })

    it('marks the cell matching selectedDay', () => {
      const wrapper = mountCalendar({ selectedDay: '2026-07-15' })

      const selected = wrapper.findAll('.calendar-cell--selected')
      expect(selected).toHaveLength(1)
      expect(selected[0].text()).toContain('15')
    })
  })

  describe('Item dots', () => {
    it('renders one dot per item on its dateKey cell, defaulting to the primary color when unset', () => {
      const wrapper = mountCalendar({
        items: [{ id: 's1', dateKey: '2026-07-10', tooltip: 'Sale A' }],
      })

      const dots = wrapper.findAll('.status-dot')
      expect(dots).toHaveLength(1)
      expect(dots[0].attributes('style')).toContain(resolveThemeColor('primary'))
    })

    it('resolves an explicit theme color name for the dot', () => {
      const wrapper = mountCalendar({
        items: [{ id: 'e1', dateKey: '2026-07-10', tooltip: 'Event A', color: 'warning' }],
      })

      const dots = wrapper.findAll('.status-dot')
      expect(dots[0].attributes('style')).toContain(resolveThemeColor('warning'))
    })
  })

  describe('Day selection', () => {
    it('emits select-day with the dateKey when a cell with items is clicked', async () => {
      const wrapper = mountCalendar({
        items: [{ id: 's1', dateKey: '2026-07-10', tooltip: 'Sale A' }],
      })

      const cell = wrapper.findAll('.calendar-cell--active')[0]
      await cell.trigger('click')

      expect(wrapper.emitted('select-day')).toEqual([['2026-07-10']])
    })

    it('does not emit select-day when an empty leading cell is clicked', async () => {
      const wrapper = mountCalendar()

      const emptyCell = wrapper.findAll('.calendar-cell--empty')[0]
      await emptyCell.trigger('click')

      expect(wrapper.emitted('select-day')).toBeUndefined()
    })

    it('does not emit select-day when a day cell with no items is clicked', async () => {
      const wrapper = mountCalendar()

      const cells = wrapper.findAll('.calendar-cell')
      const dayNoItemsCell = cells.find(
        (c) => !c.classes('calendar-cell--empty') && !c.classes('calendar-cell--active'),
      )
      await dayNoItemsCell?.trigger('click')

      expect(wrapper.emitted('select-day')).toBeUndefined()
    })
  })

  describe('Month navigation', () => {
    it('emits update:monthYear with the previous month on the prev-month click', async () => {
      const wrapper = mountCalendar({ monthYear: '2026-07' })

      await wrapper.find('[title="חודש קודם"]').trigger('click')

      expect(wrapper.emitted('update:monthYear')).toEqual([['2026-06']])
    })

    it('emits update:monthYear with the next month on the next-month click', async () => {
      const wrapper = mountCalendar({ monthYear: '2026-07' })

      await wrapper.find('[title="חודש הבא"]').trigger('click')

      expect(wrapper.emitted('update:monthYear')).toEqual([['2026-08']])
    })

    it('emits update:monthYear with the current month on the "היום" click', async () => {
      const wrapper = mountCalendar({ monthYear: '2020-01' })
      const now = new Date()
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const todayButton = wrapper.findAll('button').find((b) => b.text() === 'היום')
      await todayButton?.trigger('click')

      expect(wrapper.emitted('update:monthYear')).toEqual([[expected]])
    })
  })

  describe('Legend', () => {
    it('renders the legend row when legend is non-empty', () => {
      const wrapper = mountCalendar({ legend: [{ label: 'פעיל', color: 'success' }] })

      expect(wrapper.find('.app-calendar-legend').exists()).toBe(true)
      expect(wrapper.text()).toContain('פעיל')
    })

    it('omits the legend row when legend is undefined', () => {
      const wrapper = mountCalendar()

      expect(wrapper.find('.app-calendar-legend').exists()).toBe(false)
    })

    it('omits the legend row when legend is an empty array', () => {
      const wrapper = mountCalendar({ legend: [] })

      expect(wrapper.find('.app-calendar-legend').exists()).toBe(false)
    })
  })
})
