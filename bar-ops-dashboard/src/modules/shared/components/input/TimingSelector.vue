<template>
  <v-sheet class="timing-selector pa-3 rounded-lg border d-flex flex-column ga-3">
    <!-- Date Section Row -->
    <div class="d-flex align-center justify-space-between ga-2 flex-wrap">
      <span class="text-body-2 font-weight-medium">תאריך:</span>
      <v-btn-toggle
        v-model="dateType"
        mandatory
        color="primary"
        variant="tonal"
        density="compact"
        class="rounded-lg"
      >
        <v-btn value="session" size="small" class="px-3"> האירוע </v-btn>
        <v-btn value="nextDay" size="small" class="px-3"> למחרת </v-btn>
        <v-btn value="custom" size="small" class="px-3"> אחר </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Custom Date Picker Field -->
    <v-expand-transition>
      <div v-if="dateType === 'custom'">
        <v-text-field
          v-model="customDate"
          type="date"
          label="בחר תאריך מותאם"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-calendar"
          hide-details
        />
      </div>
    </v-expand-transition>

    <!-- Time Section Row (24-Hour Format, free-text with range validation) -->
    <div class="d-flex align-center justify-space-between ga-2">
      <span class="text-body-2 font-weight-medium">שעה:</span>
      <div class="d-flex align-start ga-1 time-inputs-row">
        <!-- Hour input (00-23) -->
        <v-text-field
          v-model="selectedHour"
          placeholder="HH"
          density="compact"
          variant="outlined"
          inputmode="numeric"
          maxlength="2"
          :rules="hourRules"
          validate-on="input"
          hide-details="auto"
          class="text-center font-weight-medium time-part-input"
          @blur="selectedHour = padTimePart(selectedHour)"
        />
        <span class="text-body-2 font-weight-bold mt-2">:</span>
        <!-- Minute input (00-59) -->
        <v-text-field
          v-model="selectedMinute"
          placeholder="MM"
          density="compact"
          variant="outlined"
          inputmode="numeric"
          maxlength="2"
          :rules="minuteRules"
          validate-on="input"
          hide-details="auto"
          class="text-center font-weight-medium time-part-input"
          @blur="selectedMinute = padTimePart(selectedMinute)"
        />
      </div>
    </div>

    <!-- Live Preview Banner -->
    <v-alert
      v-if="timingSummary"
      color="primary"
      variant="tonal"
      class="py-1 px-3 text-caption font-weight-bold rounded-lg text-center"
      density="compact"
      :icon="false"
      hide-details
    >
      {{ timingSummary }}
    </v-alert>
  </v-sheet>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { SessionStore } from '@stores'

const model = defineModel<string | undefined>({ default: '' })

let isInternalUpdate = false

const sessionStore = SessionStore()

const dateType = ref<'session' | 'nextDay' | 'custom'>('session')
const customDate = ref('')
const selectedHour = ref<string | null>('')
const selectedMinute = ref<string | null>('')

// True if empty or a 1-2 digit number within [0, max]
const isInRange = (v: string | null, max: number) =>
  v != null && /^\d{1,2}$/.test(v) && Number(v) >= 0 && Number(v) <= max

// Failing rule shows a red border and blocks the form
const hourRules = [(v: string) => !v || isInRange(v, 23) || '00-23']
const minuteRules = [(v: string) => !v || isInRange(v, 59) || '00-59']

// Zero-pad a single digit on blur ("5" -> "05")
const padTimePart = (v: string | null) => (v && /^\d$/.test(v) ? v.padStart(2, '0') : v || '')

// Date calculation helpers
const sessionDate = computed(() => {
  if (!sessionStore.session?.datetime) return ''
  return sessionStore.session.datetime.split('T')[0] || ''
})

const nextDay = computed(() => {
  if (!sessionDate.value) return ''
  const d = new Date(sessionDate.value)
  d.setDate(d.getDate() + 1)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
})

// Current date based on active tab selection
const computedDate = computed(() => {
  if (dateType.value === 'session') return sessionDate.value
  if (dateType.value === 'nextDay') return nextDay.value
  return customDate.value
})

const computedTime = computed(() => {
  if (isInRange(selectedHour.value, 23) && isInRange(selectedMinute.value, 59)) {
    return `${(selectedHour.value as string).padStart(2, '0')}:${(selectedMinute.value as string).padStart(2, '0')}`
  }
  return ''
})

const timingSummary = computed(() => {
  if (!computedDate.value || !computedTime.value) return ''

  const dateParts = computedDate.value.split('-')
  if (dateParts.length !== 3) return ''
  const month = dateParts[1] || ''
  const day = dateParts[2] || ''

  return `${day}/${month} ${computedTime.value}`
})

// Default blank time: 23:59 for custom, 18:00 otherwise
watch(computedDate, (newDate) => {
  if (newDate && (!selectedHour.value || !selectedMinute.value)) {
    if (dateType.value === 'custom') {
      selectedHour.value = '23'
      selectedMinute.value = '59'
    } else {
      selectedHour.value = '18'
      selectedMinute.value = '00'
    }
  }
})

// Watch dateType: custom initializes to event date + 23:59
watch(dateType, (newType) => {
  if (newType === 'custom') {
    customDate.value = sessionDate.value || new Date().toISOString().split('T')[0] || ''
    selectedHour.value = '23'
    selectedMinute.value = '59'
  }
})

// Keep local state in sync with model
const syncFromModel = () => {
  const val = model.value
  if (!val) {
    dateType.value = 'session'
    customDate.value = ''
    selectedHour.value = ''
    selectedMinute.value = ''
    return
  }

  const parts = val.split('T')
  const datePart = parts[0] || ''
  const timePart = parts[1] ? parts[1].slice(0, 5) : ''

  if (timePart) {
    const timeParts = timePart.split(':')
    selectedHour.value = timeParts[0] || ''
    selectedMinute.value = timeParts[1] || ''
  } else {
    selectedHour.value = ''
    selectedMinute.value = ''
  }

  if (datePart === sessionDate.value && dateType.value !== 'custom') {
    dateType.value = 'session'
  } else if (datePart === nextDay.value && dateType.value !== 'custom') {
    dateType.value = 'nextDay'
  } else {
    if (dateType.value !== 'custom') dateType.value = 'custom'
    customDate.value = datePart
  }
}

// Watch model changes (parent update or reset)
watch(
  () => model.value,
  () => {
    if (!isInternalUpdate) {
      syncFromModel()
    }
  },
)

// Watch local variables to update model
watch([computedDate, computedTime], () => {
  isInternalUpdate = true
  if (computedDate.value && computedTime.value) {
    model.value = `${computedDate.value}T${computedTime.value}`
  } else {
    model.value = ''
  }
  nextTick(() => {
    isInternalUpdate = false
  })
})

onMounted(() => {
  syncFromModel()
})
</script>

<style scoped>
.timing-selector {
  border-color: rgba(var(--v-border-color), 0.12) !important;
  background-color: rgba(var(--v-theme-surface), 0.04);
}

/* Container for HH:MM inputs — LTR direction so separators stay left of digits in RTL layouts */
.time-inputs-row {
  max-width: 220px;
  direction: ltr;
}

/* Fixed-width input for each time segment (hour / minute) */
.time-part-input {
  width: 80px;
}
</style>
