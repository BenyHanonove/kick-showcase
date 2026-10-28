<template>
  <v-card rounded="lg" :elevation="0" color="transparent" class="app-calendar pa-0">
    <div class="d-flex align-center mb-4 ga-1">
      <AppButton
        icon="mdi-chevron-right"
        variant="text"
        size="small"
        title="חודש קודם"
        @click="shiftMonth(-1)"
      />
      <AppButton variant="tonal" size="small" @click="goToday">היום</AppButton>
      <v-spacer />
      <span class="text-subtitle-1 font-weight-bold">{{ monthLabel }}</span>
      <v-spacer />
      <AppButton
        icon="mdi-chevron-left"
        variant="text"
        size="small"
        title="חודש הבא"
        @click="shiftMonth(1)"
      />
    </div>

    <div class="calendar-grid mb-2">
      <div
        v-for="day in weekDays"
        :key="day"
        class="text-center text-caption font-weight-medium text-medium-emphasis"
      >
        {{ day }}
      </div>
    </div>

    <div class="calendar-grid">
      <div
        v-for="(cell, index) in cells"
        :key="index"
        class="calendar-cell"
        :class="{
          'calendar-cell--empty': !cell,
          'calendar-cell--today': cell && cell.isToday,
          'calendar-cell--selected': cell && cell.dateKey === selectedDay,
          'calendar-cell--active': cell && cell.items.length > 0,
        }"
        @click="cell && cell.items.length && emit('select-day', cell.dateKey)"
      >
        <template v-if="cell">
          <span class="text-caption">{{ cell.dayNumber }}</span>
          <div v-if="cell.items.length" class="d-flex flex-wrap justify-center ga-1 mt-1">
            <v-tooltip
              v-for="item in cell.items"
              :key="item.id"
              :text="item.tooltip"
              location="top"
            >
              <template #activator="{ props: tipProps }">
                <span
                  v-bind="tipProps"
                  class="status-dot"
                  :style="{ backgroundColor: dotColor(item.color) }"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </div>
    </div>

    <template v-if="props.legend.length">
      <v-divider class="my-4" />
      <div class="app-calendar-legend d-flex flex-wrap ga-4 justify-center">
        <span
          v-for="meta in props.legend"
          :key="meta.label"
          class="d-inline-flex align-center ga-1 text-caption text-medium-emphasis"
        >
          <span class="status-dot" :style="{ backgroundColor: dotColorByName(meta.color) }" />
          {{ meta.label }}
        </span>
      </div>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

// Generic per-day item; entity mapping stays at call site
const props = withDefaults(
  defineProps<{
    items: { id: string; dateKey: string; tooltip: string; color?: string }[]
    legend?: { label: string; color: string }[]
    monthYear: string
    selectedDay: string | null
  }>(),
  { legend: () => [] },
)

const emit = defineEmits<{
  (e: 'select-day', dateKey: string): void
  (e: 'update:monthYear', value: string): void
}>()

const theme = useTheme()
const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

const dotColorByName = (name: string) => theme.current.value.colors[name] ?? name
const dotColor = (color?: string) =>
  color ? dotColorByName(color) : theme.current.value.colors.primary || '#1867c0'

const monthDate = computed(() => {
  const parts = (props.monthYear || new Date().toISOString().slice(0, 7)).split('-').map(Number)
  const year = parts[0] ?? new Date().getFullYear()
  const month = parts[1] ?? new Date().getMonth() + 1
  return new Date(year, month - 1, 1)
})

const monthLabel = computed(() =>
  monthDate.value.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
)

const itemsByDay = computed(() => {
  const map: Record<string, typeof props.items> = {}
  for (const item of props.items || []) {
    ;(map[item.dateKey] ||= []).push(item)
  }
  return map
})

const cells = computed(() => {
  const start = monthDate.value
  const year = start.getFullYear()
  const month = start.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = new Date().toISOString().slice(0, 10)

  const result: (null | {
    dayNumber: number
    dateKey: string
    isToday: boolean
    items: typeof props.items
  })[] = []

  for (let i = 0; i < start.getDay(); i++) result.push(null)

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    result.push({
      dayNumber: day,
      dateKey,
      isToday: dateKey === todayKey,
      items: itemsByDay.value[dateKey] || [],
    })
  }
  return result
})

// Format as YYYY-MM from local parts, avoids UTC shift
const toMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

const shiftMonth = (delta: number) => {
  const d = monthDate.value
  emit('update:monthYear', toMonthKey(new Date(d.getFullYear(), d.getMonth() + delta, 1)))
}

const goToday = () => emit('update:monthYear', toMonthKey(new Date()))
</script>

<style scoped>
.app-calendar {
  background: transparent;
  box-shadow: none;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-cell {
  min-height: 48px;
  border-radius: var(--bo-radius-sm);
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgb(var(--v-theme-outline));
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.calendar-cell--empty {
  border: none;
}

.calendar-cell--active {
  cursor: pointer;
}

.calendar-cell--active:hover {
  background-color: rgb(var(--v-theme-primary-soft));
  box-shadow: var(--bo-shadow-card);
  transform: translateY(-1px);
}

.calendar-cell--today {
  box-shadow: inset 0 0 0 2px rgb(var(--v-theme-primary));
  border-color: transparent;
}

.calendar-cell--selected {
  background-color: rgb(var(--v-theme-primary-soft));
  border-color: rgb(var(--v-theme-primary));
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
</style>
