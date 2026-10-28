import { ref, computed } from 'vue'

export interface ICalendarFilters {
  monthYear?: string | null
  clientId?: string | null
  startDate?: string | null
  endDate?: string | null
}

interface ICalendarStore {
  filters: ICalendarFilters
  setFilters(filters: Partial<ICalendarFilters>): void
}

// Local (not UTC) YYYY-MM key, so month boundaries match the user's calendar
const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

// First and last day of a YYYY-MM key, as YYYY-MM-DD
const monthBounds = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number)
  const now = new Date()
  const safeYear = year ?? now.getFullYear()
  const safeMonth = month ?? now.getMonth() + 1

  // Day 0 of the next month is the last day of this one
  const lastDay = new Date(safeYear, safeMonth, 0).getDate()

  return {
    startDate: `${monthKey}-01`,
    endDate: `${monthKey}-${String(lastDay).padStart(2, '0')}`,
  }
}

// Local YYYY-MM-DD key, matching the value format of the native date inputs
const toDayKey = (date: Date) =>
  `${toMonthKey(date)}-${String(date.getDate()).padStart(2, '0')}`

export type CalendarRangePreset = 'week' | 'month' | 'quarter'

// Quick date-range presets rendered as chips by the calendar views
export const calendarRangePresets: {
  value: CalendarRangePreset
  title: string
  icon: string
}[] = [
  { value: 'week', title: 'השבוע', icon: 'mdi-calendar-week' },
  { value: 'month', title: 'החודש', icon: 'mdi-calendar-month' },
  { value: 'quarter', title: '3 חודשים אחרונים', icon: 'mdi-calendar-range' },
]

// Resolve a preset into a concrete start/end pair
export const presetBounds = (preset: CalendarRangePreset) => {
  const now = new Date()

  if (preset === 'week') {
    // The Israeli week runs Sunday (getDay 0) through Saturday
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
    return { startDate: toDayKey(start), endDate: toDayKey(end) }
  }

  if (preset === 'quarter') {
    // This month plus the two before it; the Date ctor rolls the year back for us
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    return { startDate: toDayKey(start), endDate: monthBounds(toMonthKey(now)).endDate }
  }

  return monthBounds(toMonthKey(now))
}

export function useCalendarFilter<T extends { datetime?: string }>(
  store: ICalendarStore,
  fetchMethod: (filters?: ICalendarFilters) => Promise<unknown>,
) {
  const selectedDay = ref<string | null>(null)

  // Seed the date inputs with the current month on first load. The dashboard
  // init already fetched this month, so this only fills state — no refetch.
  if (!store.filters.monthYear && !store.filters.startDate) {
    const currentMonth = toMonthKey(new Date())
    store.setFilters({ monthYear: currentMonth, ...monthBounds(currentMonth) })
  }

  const monthYear = computed(() => store.filters.monthYear || toMonthKey(new Date()))

  const selectedDayLabel = computed(() =>
    selectedDay.value
      ? new Date(selectedDay.value).toLocaleDateString('he-IL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : '',
  )

  const handleFilter = async (newFilters: ICalendarFilters) => {
    selectedDay.value = null

    // A lone start or end date searches that single day; both together search the range
    const start = newFilters.startDate || newFilters.endDate || null
    const end = newFilters.endDate || newFilters.startDate || null

    // Replace all fields so stale values don't stick between searches
    store.setFilters({
      clientId: newFilters.clientId ?? null,
      monthYear: null,
      startDate: start,
      endDate: end,
    })
    await fetchMethod(store.filters)
  }

  // Arrows move a whole month — keep the date inputs in step with it
  const handleMonthChange = async (value: string) => {
    selectedDay.value = null
    store.setFilters({ monthYear: value, ...monthBounds(value) })
    await fetchMethod(store.filters)
  }

  const getFilteredItems = (items: T[] | null | undefined) => {
    return (items || []).filter((item) => {
      if (!selectedDay.value) return true
      return item.datetime?.slice(0, 10) === selectedDay.value
    })
  }

  return {
    selectedDay,
    monthYear,
    selectedDayLabel,
    handleFilter,
    handleMonthChange,
    getFilteredItems,
  }
}
