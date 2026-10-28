<template>
  <div class="sr-event" dir="rtl">
    <!-- Whose event it is, on one line above the name - the brand is the draw -->
    <h2 class="sr-event__name">
      <span v-if="session.brand" class="sr-event__brand">{{ session.brand }} · </span>{{ session.name }}
    </h2>

    <div class="sr-event__row">
      <v-icon size="18">mdi-calendar-clock</v-icon>
      <span>{{ formattedDatetime }}</span>
    </div>

    <div class="sr-event__row">
      <v-icon size="18">mdi-map-marker-outline</v-icon>
      <span>{{ session.location }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// Event details as they arrive from resolve, matching the WhatsApp template wording
import { computed } from 'vue'
import type { IResolvedShiftRegistration } from '@shift/types/IShiftRegistration.types'

const props = defineProps<{
  session: IResolvedShiftRegistration['session']
}>()

// "יום שלישי, 19 באוגוסט, 20:00"
const formattedDatetime = computed(() => {
  const date = new Date(props.session.datetime)
  if (isNaN(date.getTime())) return '—'

  const day = date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  const time = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  return `${day}, ${time}`
})
</script>

<style scoped>
.sr-event {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 16px 18px;
  text-align: right;
  color: #ffffff;
}

.sr-event__name {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 10px;
  color: #ffffff;
}

.sr-event__brand {
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #10b981;
}

.sr-event__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
}

.sr-event__row :deep(.v-icon) {
  color: #10b981;
}
</style>
