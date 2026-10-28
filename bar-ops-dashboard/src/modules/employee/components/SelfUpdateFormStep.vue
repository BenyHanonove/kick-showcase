<template>
  <div class="su-form" dir="rtl">
    <v-form @submit.prevent="handleSubmit">
      <h2 class="su-form__title">בוא נעדכן את הפרטים שלך</h2>

      <div class="su-form__row mb-3">
        <AppInput
          v-model="formData.firstName"
          type="text"
          label="שם פרטי*"
          class="su-field"
          base-color="rgba(255, 255, 255, 0.4)"
          color="#ffffff"
          :rules="[]"
          :error="showErrors && !formData.firstName"
          :hint="showErrors && !formData.firstName ? 'שדה חובה' : ''"
          persistent-hint
        />
        <AppInput
          v-model="formData.lastName"
          type="text"
          label="שם משפחה*"
          class="su-field"
          base-color="rgba(255, 255, 255, 0.4)"
          color="#ffffff"
          :rules="[]"
          :error="showErrors && !formData.lastName"
          :hint="showErrors && !formData.lastName ? 'שדה חובה' : ''"
          persistent-hint
        />
      </div>
      <AppInput
        v-model="formData.identityNumber"
        type="text"
        label="תעודת זהות*"
        class="su-field mb-3"
        base-color="rgba(255, 255, 255, 0.4)"
        color="#ffffff"
        :rules="[rules.required(), rules.israeliId()]"
      />
      <AppInput
        v-model="phoneDisplay"
        type="tel"
        label="טלפון*"
        class="su-field mb-3"
        base-color="rgba(255, 255, 255, 0.4)"
        color="#ffffff"
        :rules="[]"
        :error="showErrors && !formData.phone"
        :hint="showErrors && !formData.phone ? 'שדה חובה' : ''"
        persistent-hint
        maxlength="12"
      />
      <AppInput
        v-model="formData.gender"
        type="select"
        label="מגדר*"
        :items="genderItems"
        class="su-field mb-3"
        base-color="rgba(255, 255, 255, 0.4)"
        color="#ffffff"
        :rules="[]"
        :error="showErrors && !formData.gender"
        :hint="showErrors && !formData.gender ? 'שדה חובה' : ''"
        persistent-hint
      />
      <AppInput
        v-model="formData.instagram"
        type="text"
        label="אינסטגרם*"
        class="su-field mb-3"
        base-color="rgba(255, 255, 255, 0.4)"
        color="#ffffff"
        :rules="[]"
        :error="showErrors && !formData.instagram"
        :hint="showErrors && !formData.instagram ? 'שדה חובה' : ''"
        persistent-hint
      />
      <AppInput
        v-model="formData.workExperience"
        type="textarea"
        label="ניסיון תעסוקתי*"
        class="su-field mb-3"
        base-color="rgba(255, 255, 255, 0.4)"
        color="#ffffff"
        :rows="3"
        :rules="[]"
        :error="showErrors && !formData.workExperience"
        :hint="showErrors && !formData.workExperience ? 'שדה חובה' : ''"
        persistent-hint
      />
      <AppInput
        v-model="formData.address"
        type="text"
        label="כתובת*"
        class="su-field mb-3"
        base-color="rgba(255, 255, 255, 0.4)"
        color="#ffffff"
        :rules="[]"
        :error="showErrors && !formData.address"
        :hint="showErrors && !formData.address ? 'שדה חובה' : ''"
        persistent-hint
      />

      <p v-if="errorMessage" class="su-form__error">{{ errorMessage }}</p>

      <AppButton
        type="submit"
        class="su-submit w-100 mt-2"
        variant="flat"
        rounded="lg"
        size="x-large"
        :loading="submitting"
      >
        עדכן פרטים
      </AppButton>
    </v-form>
  </div>
</template>

<script setup lang="ts">
// Step 2: employee data resolved in step 1, editable here, then submitted via claim
import { reactive, computed, ref } from 'vue'
import AppInput from '@shared/components/input/AppInput.vue'
import AppButton from '@shared/components/layout/AppButton.vue'
import { employeeProvider } from '@employee/providers/employee.provider'
import { rules } from '@shared/utils/rules.util'
import { INVALID_LINK_MESSAGE } from '@shared/utils/publicLink.util'
import type { ISelfUpdateEmployee } from '@employee/types/IEmployee.types'
import { EmployeeGender, EmployeeGenderLabels } from '@employee/types/EmployeeGender.types'

const props = defineProps<{
  token: string
  initialData: ISelfUpdateEmployee | null
}>()

const emit = defineEmits<{
  updated: [firstName: string]
  rejected: []
}>()

const submitting = ref(false)
const errorMessage = ref('')

// formData.phone always holds raw digits only (e.g. 0501234567); the input displays it formatted
const formData = reactive({
  firstName: props.initialData?.firstName ?? '',
  lastName: props.initialData?.lastName ?? '',
  identityNumber: props.initialData?.identityNumber ?? '',
  phone: props.initialData?.phone ?? '',
  instagram: props.initialData?.instagram ?? '',
  workExperience: props.initialData?.workExperience ?? '',
  address: props.initialData?.address ?? '',
  gender: props.initialData?.gender ?? (null as EmployeeGender | null),
})

const genderItems = Object.entries(EmployeeGenderLabels).map(([value, title]) => ({
  title,
  value: value as EmployeeGender,
}))

// Display phone as 050-1234567 while storing raw digits for the server
const phoneDisplay = computed({
  get: () => formData.phone.replace(/(\d{3})(\d+)/, '$1-$2'),
  set: (value: string) => {
    formData.phone = value.replace(/\D/g, '').slice(0, 10)
  },
})

const isFormFilled = computed(
  () =>
    !!formData.firstName &&
    !!formData.lastName &&
    /^[0-9]{9}$/.test(formData.identityNumber) &&
    !!formData.phone &&
    !!formData.gender &&
    !!formData.instagram &&
    !!formData.workExperience &&
    !!formData.address,
)

// Only show per-field "required" errors after a submit was attempted
const showErrors = ref(false)

async function handleSubmit() {
  if (!isFormFilled.value || !formData.gender) {
    showErrors.value = true
    return
  }

  submitting.value = true
  errorMessage.value = ''

  const result = await employeeProvider.claim({
    token: props.token,
    timestamp: props.initialData?.timestamp ?? '',
    ...formData,
    gender: formData.gender,
  })

  submitting.value = false

  if (result.success) {
    emit('updated', formData.firstName)
  } else if (result.message === INVALID_LINK_MESSAGE) {
    emit('rejected')
  } else {
    errorMessage.value = result.message || 'שגיאה בעדכון הפרטים'
  }
}
</script>

<style scoped>
.su-form__row {
  display: flex;
  gap: 12px;
}

.su-form__row > * {
  flex: 1 1 0;
  min-width: 0;
}

.su-form__error {
  color: #a12b2b;
  font-size: 0.875rem;
  text-align: center;
  margin: 4px 0 0;
}

.su-form__title {
  font-size: 1.15rem;
  font-weight: 600;
  text-align: center;
  margin: 0 0 20px;
  color: #ffffff;
}

.su-field :deep(.v-field) {
  background-color: rgba(255, 255, 255, 0.04) !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.su-field :deep(.v-field--focused) {
  border-color: rgba(16, 185, 129, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
}

.su-field :deep(.v-field__input),
.su-field :deep(input),
.su-field :deep(textarea) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.su-field.v-input--error :deep(.v-input__details),
.su-field.v-input--error :deep(.v-messages) {
  color: #f87171 !important;
}

.su-field :deep(.v-field__outline) {
  display: none !important;
}

.su-field :deep(.v-label) {
  letter-spacing: 0.05em;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75) !important;
  opacity: 1;
}

.su-submit {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  font-weight: 700;
  letter-spacing: 0.06em;
  border-radius: 12px !important;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.3) !important;
  transition: all 0.25s ease !important;
}

.su-submit:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.45) !important;
}

.su-submit :deep(.v-btn__overlay) {
  display: none;
}
</style>
