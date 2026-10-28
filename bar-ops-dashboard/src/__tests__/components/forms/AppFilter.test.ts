import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFilter from '@shared/components/forms/AppFilter.vue'
import { VAutocomplete, VTextField } from 'vuetify/components'
import AppButton from '@shared/components/layout/AppButton.vue'
import type { ICalendarFilters } from '@shared/composables/useCalendarFilter.composable'

const clientOptions = [
  { title: 'Acme Bar', value: 'client-1' },
  { title: 'Test Pub', value: 'client-2' },
]

const mountFilter = (
  filters: ICalendarFilters,
  props: Partial<{ clientsLoading: boolean; selectedDayLabel: string }> = {},
  slots: Record<string, string> = {},
) =>
  mount(AppFilter, {
    props: {
      filters,
      'onUpdate:filters': (value: ICalendarFilters) => Object.assign(filters, value),
      clientOptions,
      ...props,
    },
    slots,
  })

// Open the collapsed expansion panel so fields render in the DOM
const openPanel = async (wrapper: ReturnType<typeof mountFilter>) => {
  await wrapper.find('.v-expansion-panel-title').trigger('click')
}

describe('AppFilter Component', () => {
  describe('Client options', () => {
    it('renders clientOptions in the autocomplete', async () => {
      const wrapper = mountFilter({ clientId: null, monthYear: null })
      await openPanel(wrapper)

      expect(wrapper.findComponent(VAutocomplete).props('items')).toEqual(clientOptions)
    })

    it('passes clientsLoading to the autocomplete loading state', async () => {
      const wrapper = mountFilter({ clientId: null, monthYear: null }, { clientsLoading: true })
      await openPanel(wrapper)

      expect(wrapper.findComponent(VAutocomplete).props('loading')).toBe(true)
    })
  })

  describe('Search emit', () => {
    it('emits filter with the current filters model value on search click', async () => {
      const filters: ICalendarFilters = {
        clientId: 'client-1',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }
      const wrapper = mountFilter(filters)
      await openPanel(wrapper)

      // Scope to "חפש" by text; other VBtn instances exist internally
      const searchButton = wrapper.findAllComponents(AppButton).find((b) => b.text().includes('חפש'))
      await searchButton?.trigger('click')

      expect(wrapper.emitted('filter')).toBeTruthy()
      expect(wrapper.emitted('filter')?.[0]).toEqual([
        { clientId: 'client-1', startDate: '2026-07-01', endDate: '2026-07-31' },
      ])
    })
  })

  describe('v-model:filters propagation', () => {
    it('propagates brand field edits to the bound filters model', async () => {
      const filters: ICalendarFilters = { clientId: null, monthYear: null }
      const wrapper = mountFilter(filters)
      await openPanel(wrapper)

      await wrapper.findComponent(VAutocomplete).vm.$emit('update:modelValue', 'client-2')

      expect(filters.clientId).toBe('client-2')
    })

    it('propagates start/end date field edits to the bound filters model', async () => {
      const filters: ICalendarFilters = { clientId: null, startDate: null, endDate: null }
      const wrapper = mountFilter(filters)
      await openPanel(wrapper)

      // Date fields aren't necessarily in a fixed order in the tree
      const dateFields = wrapper.findAllComponents(VTextField).filter((c) => c.props('type') === 'date')

      await dateFields[0]?.vm.$emit('update:modelValue', '2026-08-01')
      await dateFields[1]?.vm.$emit('update:modelValue', '2026-08-15')

      expect(filters.startDate).toBe('2026-08-01')
      expect(filters.endDate).toBe('2026-08-15')
    })
  })

  describe('Collapsed-state summary chips', () => {
    it('shows the brand chip when filters.clientId is set', () => {
      const wrapper = mountFilter({ clientId: 'client-1', startDate: null, endDate: null })

      expect(wrapper.text()).toContain('Acme Bar')
    })

    it('shows the date-range chip when startDate/endDate are set and no day is selected', () => {
      const expectedLabel = `${new Date('2026-07-01').toLocaleDateString('he-IL')} - ${new Date('2026-07-31').toLocaleDateString('he-IL')}`
      const wrapper = mountFilter({ clientId: null, startDate: '2026-07-01', endDate: '2026-07-31' })

      expect(wrapper.text()).toContain(expectedLabel)
    })

    it('suppresses the date-range chip and shows the day chip when selectedDayLabel is set', () => {
      const expectedLabel = `${new Date('2026-07-01').toLocaleDateString('he-IL')} - ${new Date('2026-07-31').toLocaleDateString('he-IL')}`
      const wrapper = mountFilter(
        { clientId: null, startDate: '2026-07-01', endDate: '2026-07-31' },
        { selectedDayLabel: 'שלישי, 7 ביולי' },
      )

      expect(wrapper.text()).not.toContain(expectedLabel)
      expect(wrapper.text()).toContain('שלישי, 7 ביולי')
    })
  })

  describe('Date-range preset chips', () => {
    // Scope to the chip group: the collapsed summary chips are also .v-chip
    const presetChips = (wrapper: ReturnType<typeof mountFilter>) =>
      wrapper.findAll('.v-chip-group .v-chip')

    it('applies the preset range and emits filter on chip click', async () => {
      const filters: ICalendarFilters = { clientId: 'client-1', startDate: null, endDate: null }
      const wrapper = mountFilter(filters)

      const weekChip = presetChips(wrapper).find((chip) => chip.text().includes('השבוע'))
      await weekChip?.trigger('click')

      const emitted = wrapper.emitted('filter')
      expect(emitted).toBeTruthy()

      // Sunday-based week containing today
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
      const key = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

      expect(emitted?.[0]?.[0]).toMatchObject({
        clientId: 'client-1',
        startDate: key(start),
        endDate: key(end),
      })
    })

    it('lights the chip matching the current filter dates', () => {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

      const wrapper = mountFilter({
        clientId: null,
        startDate: `${month}-01`,
        endDate: `${month}-${String(lastDay).padStart(2, '0')}`,
      })

      const selected = presetChips(wrapper).filter((chip) =>
        chip.classes().includes('v-chip--selected'),
      )
      expect(selected).toHaveLength(1)
      expect(selected[0]?.text()).toContain('החודש')
    })

    it('lights no chip for a custom range', () => {
      const wrapper = mountFilter({
        clientId: null,
        startDate: '2026-07-03',
        endDate: '2026-07-19',
      })

      const selected = presetChips(wrapper).filter((chip) =>
        chip.classes().includes('v-chip--selected'),
      )
      expect(selected).toHaveLength(0)
    })
  })

  describe('Default slot', () => {
    it('renders default slot content', async () => {
      const wrapper = mountFilter(
        { clientId: null, startDate: null, endDate: null },
        {},
        { default: '<div class="calendar-stub">Calendar</div>' },
      )
      await openPanel(wrapper)

      expect(wrapper.find('.calendar-stub').exists()).toBe(true)
    })
  })
})
