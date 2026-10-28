<template>
  <div class="mb-4">
    <v-expansion-panels v-model="open" class="app-filter" flat>
      <v-expansion-panel rounded="lg" elevation="0">
        <v-expansion-panel-title>
          <div class="d-flex align-center flex-wrap ga-2">
            <v-icon size="20">mdi-filter-variant</v-icon>
            <span class="text-subtitle-2 font-weight-bold">סינון וחיפוש</span>

            <!-- Active-filter summary — shown only while the panel is collapsed -->
            <template v-if="open !== 0">
              <v-chip
                v-for="chip in activeFilterChips"
                :key="chip.key"
                size="x-small"
                color="primary"
                variant="tonal"
                :prepend-icon="chip.icon"
              >
                {{ chip.label }}
              </v-chip>
            </template>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <!-- Below lg the brand takes its own row and the two dates share the next one -->
          <v-row dense align="center">
            <v-col cols="12" lg="3">
              <v-autocomplete
                v-model="filters.clientId"
                :items="clientOptions"
                :loading="clientsLoading"
                label="חפש לפי מותג"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                clear-icon="mdi-close-circle-outline"
                hide-details
                clearable
              />
            </v-col>

            <v-col cols="6" lg="3">
              <v-text-field
                v-model="filters.startDate"
                label="מתאריך"
                type="date"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                clear-icon="mdi-close-circle-outline"
                hide-details
                clearable
              />
            </v-col>

            <v-col cols="6" lg="3">
              <v-text-field
                v-model="filters.endDate"
                label="עד תאריך"
                type="date"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                clear-icon="mdi-close-circle-outline"
                hide-details
                clearable
              />
            </v-col>

            <v-col cols="12" lg="3">
              <AppButton
                color="primary"
                prepend-icon="mdi-magnify"
                height="48"
                rounded="lg"
                block
                @click="handleSearch"
              >
                חפש
              </AppButton>
            </v-col>
          </v-row>

          <template v-if="$slots.default">
            <v-divider class="my-4" />
            <slot />
          </template>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Quick date-range presets — applied immediately, no need to press חפש.
         Kept outside the panel so they stay reachable while it is collapsed. -->
    <v-chip-group
      :model-value="activeRange"
      variant="tonal"
      class="mt-1"
      @update:model-value="handleRangeSelect"
    >
      <v-chip
        v-for="preset in calendarRangePresets"
        :key="preset.value"
        :value="preset.value"
        color="primary"
        filter
        size="small"
        class="font-weight-bold"
      >
        <v-icon :icon="preset.icon" start size="16" class="me-1" />
        {{ preset.title }}
      </v-chip>
    </v-chip-group>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  calendarRangePresets,
  presetBounds,
  type CalendarRangePreset,
  type ICalendarFilters,
} from '@shared/composables/useCalendarFilter.composable'

// Day label and client options come from the parent
const props = withDefaults(
  defineProps<{
    clientOptions: { title: string; value: string }[]
    clientsLoading?: boolean
    selectedDayLabel?: string
  }>(),
  { clientsLoading: false, selectedDayLabel: '' },
)

const filters = defineModel<ICalendarFilters>('filters', { required: true })

const emit = defineEmits<{
  (e: 'filter', value: ICalendarFilters): void
}>()

// Collapsed by default (undefined = no panel open)
const open = ref<number | undefined>(undefined)

// --- Active-filter summary chips (shown while collapsed) ---

// Brand chosen in the dropdown
const selectedBrandLabel = computed(() =>
  filters.value.clientId
    ? props.clientOptions.find((c) => c.value === filters.value.clientId)?.title || ''
    : '',
)

// Date-range label, shown only when a start and/or end date is explicitly selected
const dateRangeLabel = computed(() => {
  const { startDate, endDate } = filters.value
  if (!startDate && !endDate) return ''
  const formatDate = (value: string) => new Date(value).toLocaleDateString('he-IL')
  if (startDate && endDate && startDate !== endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }
  return formatDate(startDate || endDate || '')
})

// Single source for collapsed summary chips
const activeFilterChips = computed(() => {
  const chips: { key: string; icon: string; label: string }[] = []
  if (selectedBrandLabel.value)
    chips.push({ key: 'brand', icon: 'mdi-tag-outline', label: selectedBrandLabel.value })
  // Show date-range chip only when no calendar day is selected
  if (dateRangeLabel.value && !props.selectedDayLabel)
    chips.push({ key: 'date-range', icon: 'mdi-calendar-range', label: dateRangeLabel.value })
  if (props.selectedDayLabel)
    chips.push({ key: 'day', icon: 'mdi-calendar-today', label: props.selectedDayLabel })
  return chips
})

const handleSearch = () => {
  emit('filter', { ...filters.value })
}

// --- Quick date-range presets ---

// Derived from the dates rather than stored, so the lit chip stays truthful when the
// range is changed from anywhere else (month arrows, manual search, a cleared field)
const activeRange = computed<CalendarRangePreset | null>(() => {
  const { startDate, endDate } = filters.value
  if (!startDate || !endDate) return null

  const match = calendarRangePresets.find((preset) => {
    const bounds = presetBounds(preset.value)
    return bounds.startDate === startDate && bounds.endDate === endDate
  })

  return match?.value ?? null
})

// v-chip-group emits an untyped value; narrow it instead of casting
const isRangePreset = (value: unknown): value is CalendarRangePreset =>
  calendarRangePresets.some((preset) => preset.value === value)

const handleRangeSelect = (value: unknown) => {
  if (!isRangePreset(value)) return

  // Mutate in place like the date fields do: filters is the store's own object, so
  // this lands in pinia immediately. Replacing it would not survive the v-model
  // round trip before the emit below reads it back.
  const bounds = presetBounds(value)
  filters.value.startDate = bounds.startDate
  filters.value.endDate = bounds.endDate

  emit('filter', { ...filters.value })
}
</script>

<style scoped>
.app-filter :deep(.v-expansion-panel) {
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline));
  box-shadow: var(--bo-shadow-card);
}

/* Soft clay focus ring on the outlined filter fields */
.app-filter :deep(.v-field--variant-outlined.v-field--focused) {
  box-shadow: 0 0 0 3px rgb(var(--v-theme-primary-soft));
}
</style>
