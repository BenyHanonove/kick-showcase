<template>
  <div class="sr-form" dir="rtl">
    <v-form @submit.prevent="handleSubmit">
      <h2 class="sr-form__title">היי {{ data.employee.firstName }}, נרשמים למשמרת</h2>

      <ShiftRegisterEventCard :session="data.session" class="mb-4" />

      <ShiftRoleSelector v-model="selectedRole" class="mb-3" />

      <p v-if="showRoleError" class="sr-form__error mb-2">יש לבחור תפקיד</p>

      <AppInput
        v-model="notes"
        type="textarea"
        label="הערה למנהל המשמרת (לא חובה)"
        class="sr-field mb-3"
        base-color="rgba(255, 255, 255, 0.4)"
        color="#ffffff"
        :rows="2"
        :rules="[]"
        maxlength="200"
      />

      <AppButton
        type="submit"
        class="sr-submit w-100 mt-1"
        variant="flat"
        rounded="lg"
        size="large"
        :loading="submitting"
      >
        אישור הרשמה
      </AppButton>

      <p class="sr-form__note">השיבוץ הסופי נקבע על ידי מנהל המשמרת</p>
    </v-form>
  </div>
</template>

<script setup lang="ts">
// Step 1: pick a role and confirm, then POST /shift/register
import { ref, computed } from 'vue'
import AppInput from '@shared/components/input/AppInput.vue'
import AppButton from '@shared/components/layout/AppButton.vue'
import ShiftRegisterEventCard from '@shift/components/ShiftRegisterEventCard.vue'
import ShiftRoleSelector from '@shift/components/ShiftRoleSelector.vue'
import { shiftProvider } from '@shift/providers/shift.provider'
import type { IResolvedShiftRegistration } from '@shift/types/IShiftRegistration.types'
import type { ShiftRole } from '@shift/types/ShiftRole.types'

const props = defineProps<{
  token: string
  data: IResolvedShiftRegistration
}>()

const emit = defineEmits<{
  registered: [role: ShiftRole]
  rejected: [message: string]
}>()

const selectedRole = ref<ShiftRole | null>(null)
const notes = ref('')
const submitting = ref(false)
const triedSubmit = ref(false)

const showRoleError = computed(() => triedSubmit.value && !selectedRole.value)

async function handleSubmit() {
  triedSubmit.value = true
  if (!selectedRole.value) return

  submitting.value = true

  const result = await shiftProvider.register({
    token: props.token,
    role: selectedRole.value,
    notes: notes.value.trim() || undefined,
  })

  submitting.value = false

  if (result.success && result.data) {
    emit('registered', result.data.role)
    return
  }

  emit('rejected', result.message || '')
}
</script>

<style scoped>
.sr-form__title {
  font-size: 1.15rem;
  font-weight: 600;
  text-align: center;
  margin: 0 0 16px;
  color: #ffffff;
}

.sr-form__error {
  color: #f87171;
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
}

.sr-form__note {
  font-size: 0.75rem;
  line-height: 1.5;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  margin: 14px 0 0;
}

.sr-field :deep(.v-field) {
  background-color: rgba(255, 255, 255, 0.04) !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.sr-field :deep(.v-field--focused) {
  border-color: rgba(16, 185, 129, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
}

.sr-field :deep(.v-field__input),
.sr-field :deep(textarea) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.sr-field :deep(.v-field__outline) {
  display: none !important;
}

.sr-field :deep(.v-label) {
  letter-spacing: 0.05em;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75) !important;
  opacity: 1;
}

.sr-submit {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  font-weight: 700;
  letter-spacing: 0.06em;
  border-radius: 12px !important;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.3) !important;
  transition: all 0.25s ease !important;
}

.sr-submit:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.45) !important;
}

.sr-submit :deep(.v-btn__overlay) {
  display: none;
}
</style>
