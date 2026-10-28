<template>
  <AppFormCard
    :title="title"
    :submitText="submitText"
    :loading="loading"
    :showReset="showReset"
    :showCancel="showCancel"
    :cancelText="cancelText"
    @submit="onSubmit"
    @reset="onReset"
    @cancel="emit('cancel')"
    ref="appFormCardRef"
  >
    <template #actions-extra>
      <v-menu
        v-if="props.enableQuantity"
        v-model="quantityMenuOpen"
        :close-on-content-click="false"
        location="top center"
        offset="8"
      >
        <template #activator="{ props: menuProps }">
          <AppButton
            color="primary"
            variant="outlined"
            size="default"
            v-bind="menuProps"
            class="rounded-lg px-3 me-2 quantity-btn"
            title="כמות קופות ליצירה"
          >
            x{{ quantity }}
          </AppButton>
        </template>
        <v-card min-width="180" class="rounded-xl pa-2 shadow-lg">
          <div class="text-caption font-weight-bold mb-2 text-center text-medium-emphasis">
            שכפול קופות
          </div>
          <v-list density="compact" class="py-0">
            <v-list-item
              v-for="n in [1, 2, 3, 5, 10]"
              :key="n"
              :title="`יצירת ${n} קופות`"
              :active="quantity === n"
              color="primary"
              rounded="lg"
              class="mb-1"
              @click="setQuantity(n)"
            />
          </v-list>
          <v-divider class="my-2" />
          <v-text-field
            :model-value="quantity"
            @update:model-value="onCustomQuantityInput"
            type="number"
            min="1"
            max="50"
            label="כמות אחרת"
            density="compact"
            hide-details
            variant="outlined"
            class="mx-1"
          />
        </v-card>
      </v-menu>
    </template>

    <v-row dense @keydown.enter="handleEnterKey">
      <template v-for="field in fields" :key="field.key">
        <v-col v-if="!field.hidden" :cols="field.cols ?? 12">
          <!-- Per-field pass-through slot lets views fully customise a field (e.g. a select
               with custom item rendering) while keeping the default config-driven inputs. -->
          <slot :name="field.key" :field="field" :form="form">
            <AppInput
              v-if="field.type === 'text' || field.type === 'number' || field.type === 'date' || field.type === 'datetime-local'"
              :model-value="getPrimitiveValue(field.key)"
              @update:model-value="(val) => setFormValue(field.key, val as FormValue, field.type)"
              :label="field.label"
              :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime-local' ? 'datetime-local' : 'text'"
              v-bind="field.props"
              :rules="field.rules"
            />
            <AppInput
              v-else-if="field.type === 'select'"
              :model-value="getSelectValue(field.key)"
              @update:model-value="(val) => setFormValue(field.key, val as FormValue)"
              :items="field.items ?? []"
              :label="field.label"
              type="select"
              v-bind="field.props"
              :rules="field.rules"
            />
            <AppInput
              v-else-if="field.type === 'textarea'"
              :model-value="getPrimitiveValue(field.key)"
              @update:model-value="(val) => setFormValue(field.key, val as FormValue)"
              :label="field.label"
              type="textarea"
              v-bind="field.props"
              :rules="field.rules"
            />
            <AppInput
              v-else-if="field.type === 'switch'"
              :model-value="getBooleanValue(field.key)"
              @update:model-value="(val) => setFormValue(field.key, val as FormValue)"
              :label="field.label"
              type="switch"
              v-bind="field.props"
            />
            <div v-else-if="field.type === 'circle-toggle'" class="d-flex align-center ga-2">
              <span class="text-body-2">{{ field.label }}</span>
              <AppButton
                icon
                variant="text"
                :color="getBooleanValue(field.key) ? 'success' : 'grey-lighten-1'"
                class="rounded-circle"
                size="small"
                @click="setFormValue(field.key, !getBooleanValue(field.key), field.type)"
                v-bind="field.props"
              >
                <v-icon
                  :icon="getBooleanValue(field.key) ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline'"
                  size="26"
                />
              </AppButton>
            </div>
            <AppInput
              v-else-if="field.type === 'checkbox'"
              :model-value="getBooleanValue(field.key)"
              @update:model-value="(val) => setFormValue(field.key, val as FormValue)"
              :label="field.label"
              type="checkbox"
              v-bind="field.props"
            />
            <AppListSelect
              v-else-if="field.type === 'list-select'"
              :model-value="getListSelectValue(field.key)"
              @update:model-value="(val) => setFormValue(field.key, val as FormValue)"
              :items="(field.items as InstanceType<typeof AppListSelect>['$props']['items']) ?? []"
              :label="field.label"
              v-bind="field.props"
            />
            <template v-else-if="field.type === 'timing'">
              <div class="text-caption mb-1 font-weight-medium">{{ field.label }}</div>
              <v-input
                :model-value="getStringValue(field.key)"
                @update:model-value="(val) => setFormValue(field.key, val)"
                :rules="field.rules"
                hide-details="auto"
              >
                <TimingSelector
                  :model-value="getStringValue(field.key)"
                  @update:model-value="(val) => setFormValue(field.key, val)"
                  class="w-100"
                  v-bind="field.props"
                />
              </v-input>
            </template>
          </slot>
        </v-col>
      </template>
    </v-row>
  </AppFormCard>
</template>

<script setup lang="ts" generic="T extends object">
import { reactive, watch, ref } from 'vue'
import AppFormCard from './AppFormCard.vue'
import type { IFormField, FormValue, Primitive } from '../../types/IForm.types'

import AppInput from '@shared/components/input/AppInput.vue'
import TimingSelector from '@shared/components/input/TimingSelector.vue'
import AppListSelect from '@shared/components/input/AppListSelect.vue'

const props = defineProps<{
  title: string
  submitText: string
  loading: boolean
  fields: IFormField[]
  initialValues: T
  showReset?: boolean
  showCancel?: boolean
  cancelText?: string
  enableQuantity?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', form: T, quantity: number): void
  (e: 'cancel'): void
  (e: 'update:form', form: T): void
}>()

const form = reactive({ ...props.initialValues }) as Record<string, FormValue>
const appFormCardRef = ref<InstanceType<typeof AppFormCard> | null>(null)

// Quantity selector state and functions
const quantity = ref(1)
const quantityMenuOpen = ref(false)

const setQuantity = (n: number) => {
  quantity.value = n
  quantityMenuOpen.value = false
}

const onCustomQuantityInput = (val: string | number) => {
  const parsed = parseInt(String(val), 10)
  if (!isNaN(parsed) && parsed >= 1) {
    quantity.value = Math.min(parsed, 50)
  } else {
    quantity.value = 1
  }
}

// Sync form if initialValues change (useful for Update components)
// Skip reset while loading to avoid clearing early
watch(
  () => props.initialValues,
  (newValues) => {
    if (!props.loading) {
      Object.assign(form, newValues)
      quantity.value = 1
    }
  },
  { deep: true },
)

// Emit form updates so parents can react to changes
watch(
  form,
  (newForm) => {
    emit('update:form', { ...newForm } as T)
  },
  { deep: true },
)

const onSubmit = () => {
  emit('submit', { ...form } as T, quantity.value)
}

const onReset = () => {
  Object.assign(form, props.initialValues)
  quantity.value = 1
  appFormCardRef.value?.resetValidation()
}

const handleEnterKey = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement
  if (!target) return

  // Let textareas submit or newline normally
  if (target.tagName === 'TEXTAREA') {
    return
  }

  // We only target actual inputs or elements with tabindex
  if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && !target.getAttribute('tabindex')) {
    return
  }

  event.preventDefault()

  const formElement = event.currentTarget as HTMLElement
  if (!formElement) return

  // Find all focusable form fields (inputs, selects, textareas)
  const selector = 'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
  const focusables = Array.from(formElement.querySelectorAll(selector)) as HTMLElement[]

  // Filter for visible elements
  const visibleFocusables = focusables.filter((el) => {
    const rect = el.getBoundingClientRect()
    const hasSize = rect.width > 0 && rect.height > 0
    const style = window.getComputedStyle(el)
    return hasSize && style.display !== 'none' && style.visibility !== 'hidden'
  })

  const currentIndex = visibleFocusables.findIndex((el) => el === target || el.contains(target))

  if (currentIndex !== -1 && currentIndex < visibleFocusables.length - 1) {
    visibleFocusables[currentIndex + 1]?.focus()
  } else {
    target.blur()
  }
}

const setFormValue = (key: string, val: FormValue, fieldType?: string) => {
  if (fieldType === 'number' && typeof val === 'string' && val !== '') {
    form[key] = Number(val)
  } else {
    form[key] = val
  }
}

// Getter helpers for type-safe form values
const getPrimitiveValue = (key: string): Primitive => {
  return form[key] as Primitive
}

const getSelectValue = (key: string): Primitive | Primitive[] => {
  return form[key] as Primitive | Primitive[]
}

const getListSelectValue = (key: string): string | number | (string | number)[] | undefined => {
  return form[key] as string | number | (string | number)[] | undefined
}

const getBooleanValue = (key: string): boolean | undefined => {
  return form[key] as boolean | undefined
}

const getStringValue = (key: string): string | undefined => {
  return form[key] as string | undefined
}
</script>

<style scoped>
/* Quantity multiplier button — fixed size for consistent alignment */
.quantity-btn {
  min-width: 48px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
