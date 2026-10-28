<template>
  <v-card variant="flat" class="mx-auto rounded-lg">
    <v-card-title class="pa-4">
      <div class="text-h5 font-weight-bold">ניהול עליות / ירידות</div>
      <div
        v-if="employeeName"
        class="text-subtitle-2 text-medium-emphasis d-flex align-center ga-1"
      >
        <v-icon size="small">mdi-account</v-icon>
        {{ employeeName }}
      </div>
    </v-card-title>

    <v-container v-if="IntervalCrud.loading.value" class="d-flex justify-center my-6">
      <v-progress-circular indeterminate color="secondary" size="40" />
    </v-container>

    <v-card-text class="pa-0" v-else>
      <div v-if="IntervalCrud.editingId.value && editingInterval" class="pa-4">
        <GenericForm
          title="עריכת שעות"
          submit-text="עדכן שעות"
          :loading="IntervalCrud.isUpdating.value"
          :fields="IntervalCrud.getIntervalFields(editForm)"
          :initial-values="editingInterval"
          show-cancel
          @update:form="(f) => (editForm = f)"
          @submit="IntervalCrud.onUpdate"
          @cancel="IntervalCrud.editingId.value = null"
        />
      </div>

      <div v-else-if="IntervalCrud.isAdding.value" class="pa-4">
        <GenericForm
          title="הוסף שעות"
          submit-text="הוסף שעות"
          :loading="IntervalCrud.isCreating.value"
          :fields="IntervalCrud.getIntervalFields(createForm)"
          :initial-values="intervalCreateInitial"
          show-cancel
          @update:form="(f) => (createForm = f)"
          @submit="IntervalCrud.onCreate"
          @cancel="IntervalCrud.isAdding.value = false"
        />
      </div>

      <div v-else>
        <AppTable
          v-if="IntervalCrud.intervals.value.length > 0"
          :headers="intervalTableHeaders"
          :items="IntervalCrud.intervals.value"
          class="bg-transparent"
          :sticky-first-column="false"
        >
          <template #start="{ value }">
            <span class="text-body-2">{{ formatShiftTiming(value as string) }}</span>
          </template>
          <template #end="{ value }">
            <span class="text-body-2">{{ formatShiftTiming(value as string) }}</span>
          </template>
          <template #total="{ item }">
            <span class="text-body-2 font-weight-bold text-secondary">
              {{ calculateDiffInHours(item.start as string, item.end as string).toFixed(2) }}
            </span>
          </template>
          <template #actions="{ item }">
            <div class="d-flex justify-end ga-1 px-0">
              <AppButton
                icon="mdi-pencil"
                variant="text"
                size="small"
                color="primary"
                :disabled="
                  IntervalCrud.isDeleting.value && IntervalCrud.selectedItem.value?.id === item.id
                "
                @click="IntervalCrud.editingId.value = item.id as string"
              />
              <AppButton
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                :loading="
                  IntervalCrud.isDeleting.value && IntervalCrud.selectedItem.value?.id === item.id
                "
                @click="IntervalCrud.onDelete(item.id as string)"
              />
            </div>
          </template>
        </AppTable>

        <div v-else class="pa-8 text-center text-medium-emphasis">
          <v-icon size="48" class="mb-2">mdi-clock-alert-outline</v-icon>
          <p>טרם הוזנו שעות למשמרת זו</p>
        </div>

        <v-card-actions class="pa-4 bg-surface-light">
          <AppButton
            block
            color="secondary"
            prepend-icon="mdi-plus"
            variant="flat"
            size="large"
            @click="startAdding"
          >
            הוסף עליה / ירידה
          </AppButton>
        </v-card-actions>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import { SessionStore, EmployeesStore } from '@stores'

import { useIntervalCrud } from '@interval/composables/interval.crud'
import { useFormatter } from '@shared/composables/useFormatter.composable'

import GenericForm from '@shared/components/forms/GenericForm.vue'
import AppTable from '@shared/components/data/AppTable.vue'

const props = defineProps<{
  sessionId: string
  shiftId: string
}>()

// Local interval form shape
type IntervalFormData = { start: string; end: string }

// Initialize formatter composable
const { formatShiftTiming, calculateDiffInHours } = useFormatter()

const intervalTableHeaders = [
  { key: 'start', label: 'עליה', align: 'right' as const },
  { key: 'end', label: 'ירידה', align: 'right' as const },
  { key: 'total', label: 'סה"כ', align: 'right' as const },
  { key: 'actions', label: '', align: 'left' as const },
]

// Initialize interval CRUD actions and reactive state
const IntervalCrud = useIntervalCrud(props.shiftId, props.sessionId)

// Resolve the assigned employee's full name from the shift
const sessionStore = SessionStore()
const employeesStore = EmployeesStore()
const employeeName = computed(() => {
  const shift = sessionStore.shifts?.data?.find((s) => s.id === props.shiftId)
  if (!shift) return ''
  const emp = employeesStore.get(shift.employeeId)
  return emp ? `${emp.firstName} ${emp.lastName}` : ''
})

// Live form snapshots let field-builder cross-check "end" vs "start"
const createForm = ref<Partial<IntervalFormData>>({})
const editForm = ref<Partial<IntervalFormData>>({})

// Stable initial value for create form, recomputed on open
const intervalCreateInitial = ref<IntervalFormData>({ start: '', end: '' })

// The interval currently being edited, resolved from the active editingId
const editingInterval = computed(
  () => IntervalCrud.intervals.value.find((i) => i.id === IntervalCrud.editingId.value) || null,
)

// Open the add form with a fresh "now" start time
const startAdding = () => {
  intervalCreateInitial.value = IntervalCrud.intervalInitialState()
  createForm.value = { ...intervalCreateInitial.value }
  IntervalCrud.isAdding.value = true
}
</script>
