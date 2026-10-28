<template>
  <div class="d-flex flex-column align-start ga-1">
    <div class="d-flex align-center flex-wrap ga-2">
      <v-chip
        color="primary"
        :variant="selected.length ? 'flat' : 'tonal'"
        size="large"
        prepend-icon="mdi-account-multiple-outline"
        append-icon="mdi-chevron-left"
        class="font-weight-medium"
        @click="openDialog"
      >
        {{ chipLabel }}
      </v-chip>

      <v-chip
        v-if="selected.length"
        variant="text"
        size="small"
        prepend-icon="mdi-close"
        @click="selected = []"
      >
        נקה
      </v-chip>
    </div>

    <!-- Per-category breakdown of the confirmed recipients -->
    <span v-if="selectedBreakdown" class="text-caption text-medium-emphasis">
      {{ selectedBreakdown }}
    </span>

    <span v-if="excludedCount" class="text-caption text-medium-emphasis">
      {{ excludedLabel }}
    </span>

    <AppDialog
      v-model="isOpen"
      type="form"
      title="בחירת עובדים"
      confirm-text="אישור"
      @confirm="confirmSelection"
      @cancel="isOpen = false"
    >
      <div class="employee-picker">
        <v-btn-toggle
          v-model="mode"
          mandatory
          color="primary"
          variant="tonal"
          density="compact"
          class="rounded-lg mb-3 w-100"
        >
          <v-btn
            value="name"
            size="small"
            class="flex-grow-1"
            prepend-icon="mdi-account-search-outline"
          >
            לפי שם
          </v-btn>
          <v-btn value="category" size="small" class="flex-grow-1" prepend-icon="mdi-account-star-outline">
            לפי רמה
          </v-btn>
        </v-btn-toggle>

        <!-- The list select ships its own outlined card; inside a dialog that nested box
             reads as a hard edge, so its chrome is stripped and it sits on the dialog surface -->
        <AppListSelect
          v-if="mode === 'name'"
          v-model="draft"
          :items="employeeItems"
          placeholder="חפש עובד לפי שם..."
          multiple
          height="300px"
        />

        <div v-else class="category-panel">
          <p class="text-caption text-medium-emphasis mb-2">
            בחירת רמה מסמנת את כל העובדים בה - אפשר לבחור כמה
          </p>
          <v-list density="compact" class="py-0">
            <v-list-item
              v-for="category in categoryOptions"
              :key="category.key"
              :active="isCategorySelected(category)"
              :disabled="!category.ids.length"
              color="primary"
              class="mb-1"
              @click="toggleCategory(category)"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="isCategorySelected(category)"
                  :indeterminate="isCategoryPartial(category)"
                  color="primary"
                  hide-details
                  density="compact"
                  class="mr-2"
                  @click.stop="toggleCategory(category)"
                />
              </template>
              <v-list-item-title class="d-flex align-center ga-2 font-weight-medium">
                <v-icon :icon="category.icon" :color="category.color" size="18" />
                {{ category.title }}
              </v-list-item-title>
              <template #append>
                <v-chip size="x-small" variant="tonal" class="font-weight-bold">
                  {{ category.ids.length }} עובדים
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </div>

      <div class="d-flex align-center justify-space-between mt-2">
        <span
          class="text-body-2"
          :class="draft.length ? 'text-primary font-weight-bold' : 'text-medium-emphasis'"
        >
          {{ recipientSummary(draft.length) }}
        </span>
        <v-chip size="small" variant="text" @click="toggleAll">
          {{ isAllSelected ? 'נקה הכל' : 'בחר הכל' }}
        </v-chip>
      </div>
    </AppDialog>
  </div>
</template>

<script setup lang="ts">
// Recipient picker for the WhatsApp broadcasts; the pool is every approved employee
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { EmployeesStore } from '@stores'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import AppListSelect, { type ISelectItem } from '@shared/components/input/AppListSelect.vue'
import { EmployeeStatus } from '@employee/types/EmployeeStatus.types'
import {
  EmployeeLevel,
  EmployeeLevelColors,
  EmployeeLevelIcons,
  EmployeeLevelLabels,
  EmployeeLevelOrder,
} from '@employee/types/EmployeeLevel.types'

type PickerMode = 'name' | 'category'

// Unrated employees still need a bucket to be reachable
const NO_CATEGORY = 'none'

interface ICategoryOption {
  key: EmployeeLevel | typeof NO_CATEGORY
  title: string
  icon: string
  color?: string
  ids: string[]
}

const selected = defineModel<string[]>({ default: () => [] })

const props = withDefaults(
  defineProps<{
    // Employees that must not be offered, e.g. already staffed on the event
    excludeIds?: string[]
  }>(),
  { excludeIds: () => [] },
)

const employeesStore = EmployeesStore()
const { employees } = storeToRefs(employeesStore)

const isOpen = ref(false)
const mode = ref<PickerMode>('name')
const draft = ref<string[]>([])

const isEmployeeLevel = (value: unknown): value is EmployeeLevel =>
  EmployeeLevelOrder.some((level) => level === value)

const excludedSet = computed(() => new Set(props.excludeIds))

// Pending employees never receive broadcasts
const approvedEmployees = computed(() =>
  (employees.value || []).filter((employee) => employee.status !== EmployeeStatus.PENDING),
)

const eligibleEmployees = computed(() =>
  approvedEmployees.value.filter((employee) => !excludedSet.value.has(employee.id)),
)

const excludedCount = computed(() => approvedEmployees.value.length - eligibleEmployees.value.length)

const excludedLabel = computed(() =>
  excludedCount.value === 1
    ? 'עובד אחד כבר משובץ לאירוע ולא יופיע ברשימה'
    : `${excludedCount.value} עובדים כבר משובצים לאירוע ולא יופיעו ברשימה`,
)

// Drop picks that became excluded after they were chosen
watch(excludedSet, (excluded) => {
  if (selected.value.some((id) => excluded.has(id))) {
    selected.value = selected.value.filter((id) => !excluded.has(id))
  }
})

const employeeItems = computed<ISelectItem[]>(() =>
  eligibleEmployees.value.map((employee) => ({
    title: `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim(),
    value: employee.id as string,
  })),
)

const allEmployeeIds = computed(() => employeeItems.value.map((item) => item.value as string))

// Category = the employee level; every level is listed, even when empty, so the counts read in full
const categoryOptions = computed<ICategoryOption[]>(() => {
  const groups = new Map<ICategoryOption['key'], string[]>()

  for (const employee of eligibleEmployees.value) {
    const key = isEmployeeLevel(employee.level) ? employee.level : NO_CATEGORY
    groups.set(key, [...(groups.get(key) ?? []), employee.id])
  }

  const options: ICategoryOption[] = EmployeeLevelOrder.map((level) => ({
    key: level,
    title: EmployeeLevelLabels[level],
    icon: EmployeeLevelIcons[level],
    color: EmployeeLevelColors[level],
    ids: groups.get(level) ?? [],
  }))

  const uncategorized = groups.get(NO_CATEGORY) ?? []
  if (uncategorized.length) {
    options.push({ key: NO_CATEGORY, title: 'ללא דירוג', icon: 'mdi-circle-outline', ids: uncategorized })
  }

  return options
})

const draftSet = computed(() => new Set(draft.value))

const isCategorySelected = (category: ICategoryOption) =>
  category.ids.length > 0 && category.ids.every((id) => draftSet.value.has(id))

const isCategoryPartial = (category: ICategoryOption) =>
  !isCategorySelected(category) && category.ids.some((id) => draftSet.value.has(id))

// Categories combine as a union; unticking one drops only its own employees
const toggleCategory = (category: ICategoryOption) => {
  if (isCategorySelected(category)) {
    const removed = new Set(category.ids)
    draft.value = draft.value.filter((id) => !removed.has(id))
    return
  }

  draft.value = [...new Set([...draft.value, ...category.ids])]
}

const isAllSelected = computed(
  () =>
    allEmployeeIds.value.length > 0 && allEmployeeIds.value.every((id) => draftSet.value.has(id)),
)

const toggleAll = () => {
  draft.value = isAllSelected.value ? [] : [...allEmployeeIds.value]
}

const recipientSummary = (count: number) => {
  if (count === 0) return 'לא נבחרו עובדים'
  if (count === 1) return 'עובד אחד יקבל את ההודעה'
  return `${count} עובדים יקבלו את ההודעה`
}

const chipLabel = computed(() =>
  selected.value.length ? recipientSummary(selected.value.length) : 'בחר/י עובדים לשליחה',
)

// "מנוסה 4 · בכיר 2" - so the confirmed pick is readable without reopening the dialog
const selectedBreakdown = computed(() => {
  const picked = new Set(selected.value)

  return categoryOptions.value
    .map((category) => ({
      title: category.title,
      count: category.ids.filter((id) => picked.has(id)).length,
    }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.title} ${entry.count}`)
    .join(' · ')
})

const openDialog = () => {
  draft.value = [...selected.value]
  isOpen.value = true
}

const confirmSelection = () => {
  selected.value = [...draft.value]
  isOpen.value = false
}
</script>

<style scoped>
/* The dialog sizes to its content, so filtering would resize it on every keystroke.
   Width is measured off the viewport, not the parent: the shrink-to-fit dialog gets
   its width from this box, so a percentage here would be circular. 64px = 16px
   dialog margin plus 16px card padding, each side */
.employee-picker {
  width: min(480px, calc(100dvw - 64px));
}

/* max-height alone lets a short result list collapse the box - lock the height */
.employee-picker :deep(.list-container) {
  height: 300px;
  scrollbar-gutter: stable;
}

/* Same footprint as the search field plus list, so switching modes doesn't resize the dialog */
.category-panel {
  height: 348px;
  overflow-y: auto;
}

/* Flatten the nested card so the search and list sit flush on the dialog */
.employee-picker :deep(.v-card) {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0;
}

.employee-picker :deep(.v-list-item) {
  border-radius: 10px;
}
</style>
