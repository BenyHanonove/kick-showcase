import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'

import { SessionStore, EmployeesStore } from '@stores'
import { ShiftRole, ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import type { IShift } from '@shift/types/IShift.types'

// Same palette as the hours distribution in ShiftsSummary
export const ShiftRoleColors: Record<ShiftRole, string> = {
  [ShiftRole.BAR_MANAGER]: 'teal',
  [ShiftRole.BARTENDER]: 'primary',
  [ShiftRole.WAITER_MANAGER]: 'indigo',
  [ShiftRole.WAITER]: 'info',
  [ShiftRole.RUNNER]: 'warning',
}

const roleOrder = [
  ShiftRole.BAR_MANAGER,
  ShiftRole.BARTENDER,
  ShiftRole.WAITER_MANAGER,
  ShiftRole.WAITER,
  ShiftRole.RUNNER,
]

export interface IArrivalPerson {
  shiftId: string
  fullName: string
  role: ShiftRole
  approved: boolean
  phone: string
}

export interface IArrivalGroup {
  key: string
  minute: number
  time: string
  people: IArrivalPerson[]
  byRole: { role: ShiftRole; label: string; color: string; people: IArrivalPerson[] }[]
  passed: boolean
}

// A group placed on the calendar grid
export interface IArrivalBlock {
  group: IArrivalGroup
  top: number
  height: number
  col: number
  cols: number
  nameCols: number
  shownPeople: IArrivalPerson[]
  hiddenCount: number
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

// Grid geometry in px
export const GRID_PAD_TOP = 12
const BLOCK_MIN_H = 30
const BLOCK_GAP = 2
const BLOCK_HEADER_H = 26
const BLOCK_ROW_H = 24
const BLOCK_PAD = 6
const BLOCK_PAD_X = 16
const NAME_COL_W = 170

export const ZOOM_MIN = 48
export const ZOOM_MAX = 720
const ZOOM_DEFAULT = 180

const parseTiming = (timing?: string): Date | null => {
  if (!timing || timing.trim() === '') return null
  const date = new Date(timing)
  return isNaN(date.getTime()) ? null : date
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })

const formatDate = (date: Date) =>
  date.toLocaleDateString('he-IL', { weekday: 'short', day: '2-digit', month: '2-digit' })

// areaWidth = px width of the blocks area, so wide screens fit names side by side
export const useShiftArrivals = (areaWidth: Ref<number> = ref(0)) => {
  const sessionStore = SessionStore()
  const employeesStore = EmployeesStore()

  // Ticks every minute so the now-line and passed state stay live
  const now = ref(Date.now())
  let ticker: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    ticker = setInterval(() => (now.value = Date.now()), MINUTE_MS)
  })
  onUnmounted(() => clearInterval(ticker))

  const shifts = computed(() => sessionStore.registeredShifts)

  const toPerson = (shift: IShift): IArrivalPerson => {
    const emp = employeesStore.get(shift.employeeId)
    return {
      shiftId: shift.id,
      fullName: emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע',
      role: shift.role,
      approved: shift.approved,
      phone: emp?.phone || '',
    }
  }

  const byRoleThenName = (a: IArrivalPerson, b: IArrivalPerson) =>
    roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role) ||
    a.fullName.localeCompare(b.fullName, 'he')

  const arrivalGroups = computed<IArrivalGroup[]>(() => {
    const buckets = new Map<number, IShift[]>()
    for (const shift of shifts.value) {
      const date = parseTiming(shift.timing)
      if (!date) continue
      // Same minute = same arrival group
      const minute = Math.floor(date.getTime() / MINUTE_MS) * MINUTE_MS
      buckets.set(minute, [...(buckets.get(minute) || []), shift])
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a - b)
      .map(([minute, groupShifts]) => {
        const people = groupShifts.map(toPerson).sort(byRoleThenName)
        return {
          key: String(minute),
          minute,
          time: formatTime(new Date(minute)),
          people,
          byRole: roleOrder
            .map((role) => ({
              role,
              label: ShiftRoleLabels[role],
              color: ShiftRoleColors[role],
              people: people.filter((p) => p.role === role),
            }))
            .filter((r) => r.people.length > 0),
          passed: minute + MINUTE_MS <= now.value,
        }
      })
  })

  const missingTiming = computed(() =>
    shifts.value
      .filter((s) => !parseTiming(s.timing))
      .map(toPerson)
      .sort(byRoleThenName),
  )

  const nextGroup = computed(() => arrivalGroups.value.find((g) => !g.passed) || null)

  // Zoom = pixels per hour
  const pxPerHour = ref(ZOOM_DEFAULT)
  const setZoom = (value: number) => {
    pxPerHour.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value))
  }

  // Whole hours from the first arrival to one hour after the last
  const range = computed(() => {
    const first = arrivalGroups.value[0]
    const last = arrivalGroups.value[arrivalGroups.value.length - 1]
    if (!first || !last) return null
    const start = Math.floor(first.minute / HOUR_MS) * HOUR_MS
    const end = Math.floor(last.minute / HOUR_MS) * HOUR_MS + HOUR_MS
    return { start, end }
  })

  const spansMultipleDays = computed(() => {
    if (!range.value) return false
    return new Date(range.value.start).toDateString() !== new Date(range.value.end - 1).toDateString()
  })

  const topOf = (ms: number) =>
    range.value ? ((ms - range.value.start) / HOUR_MS) * pxPerHour.value + GRID_PAD_TOP : 0

  const gridHeight = computed(() => {
    if (!range.value) return 0
    return ((range.value.end - range.value.start) / HOUR_MS) * pxPerHour.value + GRID_PAD_TOP * 2
  })

  const hourMarks = computed(() => {
    if (!range.value) return []
    const marks = []
    for (let ms = range.value.start; ms <= range.value.end; ms += HOUR_MS) {
      const date = new Date(ms)
      const showDate = spansMultipleDays.value && (ms === range.value.start || date.getHours() === 0)
      marks.push({ ms, top: topOf(ms), label: formatTime(date), dateLabel: showDate ? formatDate(date) : '' })
    }
    return marks
  })

  // Half-hour lines only once there is room for them
  const halfHourTops = computed(() =>
    pxPerHour.value < 120 ? [] : hourMarks.value.slice(0, -1).map((m) => m.top + pxPerHour.value / 2),
  )

  const nowTop = computed(() => {
    if (!range.value || now.value < range.value.start || now.value > range.value.end) return null
    return topOf(now.value)
  })

  // Google-Calendar-style layout: each block runs until the next arrival; blocks too close
  // to fit their header sit side by side
  const blocks = computed<IArrivalBlock[]>(() => {
    const groups = arrivalGroups.value
    const gridEnd = gridHeight.value - GRID_PAD_TOP
    const tops = groups.map((g) => topOf(g.minute))
    const result: IArrivalBlock[] = []

    let i = 0
    while (i < groups.length) {
      // Grow the cluster while the next arrival lands inside the minimum block height
      let j = i
      while (j + 1 < groups.length && (tops[j + 1] ?? 0) < (tops[j] ?? 0) + BLOCK_MIN_H) j++
      const clusterEnd = tops[j + 1] ?? gridEnd
      const cols = j - i + 1

      for (let k = i; k <= j; k++) {
        const group = groups[k]
        const top = tops[k] ?? 0
        if (!group) continue
        const height = Math.max(BLOCK_MIN_H, clusterEnd - top - BLOCK_GAP)
        const rows = Math.max(0, Math.floor((height - BLOCK_HEADER_H - BLOCK_PAD) / BLOCK_ROW_H))
        const nameCols = Math.max(1, Math.floor((areaWidth.value / cols - BLOCK_PAD_X) / NAME_COL_W))
        const capacity = rows * nameCols
        // Keep the last cell for the "+N" line when not everyone fits
        const shown = capacity >= group.people.length ? group.people.length : Math.max(0, capacity - 1)
        result.push({
          group,
          top,
          height,
          col: k - i,
          cols,
          nameCols,
          shownPeople: group.people.slice(0, shown),
          hiddenCount: group.people.length - shown,
        })
      }
      i = j + 1
    }
    return result
  })

  return {
    shifts,
    arrivalGroups,
    missingTiming,
    nextGroup,
    pxPerHour,
    setZoom,
    gridHeight,
    hourMarks,
    halfHourTops,
    nowTop,
    blocks,
    topOf,
  }
}
