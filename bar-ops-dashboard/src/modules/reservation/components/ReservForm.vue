<template>
  <div class="rf-panel">
    <!-- Header -->
    <header class="rf-header">
      <p class="rf-overline" dir="ltr">GET A QUOTE</p>
      <h2 class="rf-title">פרטי האירוע</h2>
      <p class="rf-subtitle">מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת</p>
    </header>

    <!-- Step Indicator -->
    <nav class="rf-stepper" aria-label="שלבי הטופס">
      <div
        class="rf-step-tab"
        :class="{ 'rf-step-tab--active': currentStep === 1, 'rf-step-tab--done': currentStep > 1 }"
        @click="goToStep(1)"
      >
        <span class="rf-step-num" dir="ltr">01</span>
        <span class="rf-step-text">פרטי קשר</span>
      </div>

      <div class="rf-step-line" :class="{ 'rf-step-line--active': currentStep === 2 }" />

      <div
        class="rf-step-tab"
        :class="{ 'rf-step-tab--active': currentStep === 2 }"
      >
        <span class="rf-step-num" dir="ltr">02</span>
        <span class="rf-step-text">פרטי האירוע</span>
      </div>
    </nav>

    <!-- Form Container -->
    <v-form ref="formRef" v-model="isFormValid" class="rf-form" @submit.prevent="handleSubmit">
      <!-- STEP 1: Contact & Event Type -->
      <transition name="rf-slide" mode="out-in">
        <div v-if="currentStep === 1" key="step-1" class="rf-step-content">
          <v-row dense>
            <v-col cols="12" sm="6">
              <AppInput
                v-model="form.fullName"
                label="שם מלא*"
                type="text"
                class="rf-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rules="[rules.required('חובה להזין שם מלא')]"
                prepend-inner-icon="mdi-account-outline"
                hide-details="auto"
                autocomplete="name"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <AppInput
                v-model="phoneInput"
                label="מספר טלפון*"
                type="tel"
                class="rf-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rules="[
                  rules.required('חובה להזין מספר טלפון'),
                  rules.phone('מספר טלפון לא תקין (לדוגמה: 052-1234567)'),
                ]"
                prepend-inner-icon="mdi-phone-outline"
                hide-details="auto"
                autocomplete="tel"
              />
            </v-col>

            <v-col cols="12">
              <AppInput
                v-model="form.eventType"
                label="סוג האירוע*"
                type="select"
                :items="eventTypes"
                class="rf-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rules="[rules.required('חובה לבחור סוג אירוע')]"
                prepend-inner-icon="mdi-party-popper"
                :clearable="false"
                hide-details="auto"
              />
            </v-col>
          </v-row>

          <div class="rf-actions mt-4">
            <AppButton
              type="button"
              class="rf-submit-btn"
              block
              size="x-large"
              variant="flat"
              rounded="lg"
              @click="handleNextStep"
            >
              <span>המשך לפרטי האירוע</span>
              <v-icon end>mdi-arrow-left</v-icon>
            </AppButton>
          </div>
        </div>

        <!-- STEP 2: Event Details, Notes & Submit -->
        <div v-else key="step-2" class="rf-step-content">
          <v-row dense>
            <v-col cols="6">
              <AppInput
                v-model="form.eventDate"
                label="תאריך משוער"
                type="date"
                class="rf-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                prepend-inner-icon="mdi-calendar-outline"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="6">
              <AppInput
                v-model="form.guestCount"
                label="מספר אורחים משוער"
                type="number"
                class="rf-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                prepend-inner-icon="mdi-account-group-outline"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12">
              <AppInput
                v-model="form.location"
                label="אזור / מקום האירוע"
                type="text"
                class="rf-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                prepend-inner-icon="mdi-map-marker-outline"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12">
              <AppInput
                v-model="form.notes"
                label="הערות ודגשים מיוחדים"
                type="textarea"
                :rows="2"
                class="rf-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                prepend-inner-icon="mdi-text"
                hide-details="auto"
              />
            </v-col>
          </v-row>

          <v-checkbox
            v-model="form.marketingConsent"
            color="primary"
            density="compact"
            class="mt-1"
            hide-details
          >
            <template #label>
              <span class="text-caption" style="color: rgba(255, 255, 255, 0.75);">
                אני מאשר/ת קבלת הצעות מיוחדות, הטבות ועדכונים מ-KICK (ניתן להסיר בכל עת).
              </span>
            </template>
          </v-checkbox>

          <p class="rf-legal-note">
            בלחיצה על הכפתור הנך מאשר/ת את 
            <RouterLink to="/privacy-policy" target="_blank" class="rf-link">מדיניות הפרטיות</RouterLink>
            ואת 
            <RouterLink to="/terms" target="_blank" class="rf-link">תנאי השימוש</RouterLink>.
          </p>

          <div class="rf-step2-actions">
            <AppButton
              type="button"
              class="rf-back-btn"
              variant="outlined"
              size="x-large"
              rounded="lg"
              @click="goToStep(1)"
            >
              <v-icon start>mdi-arrow-right</v-icon>
              <span>חזרה</span>
            </AppButton>

            <AppButton
              type="submit"
              class="rf-submit-btn flex-grow-1"
              size="x-large"
              variant="flat"
              rounded="lg"
              :loading="props.loading"
              :disabled="props.loading"
            >
              <span>שליחת הפרטים</span>
              <v-icon end>mdi-check</v-icon>
            </AppButton>
          </div>

          <p v-if="props.errorMessage" class="rf-error">{{ props.errorMessage }}</p>
        </div>
      </transition>
    </v-form>
  </div>
</template>

<script setup lang="ts">
// Event brief form — collects the lead and hands a ready payload to the page
import { ref, reactive, computed } from 'vue'
import { rules } from '@shared/utils/rules.util'
import type { ICreateReservation } from '@reservation/types/IReservation.types'
import {
  ReservationEventType,
  ReservationEventTypeLabels,
} from '@reservation/types/ReservationEventType.types'
import AppButton from '@shared/components/layout/AppButton.vue'
import AppInput from '@shared/components/input/AppInput.vue'

const props = defineProps<{ loading?: boolean; errorMessage?: string }>()

const emit = defineEmits<{
  (e: 'submit', payload: ICreateReservation): void
}>()

const currentStep = ref<1 | 2>(1)
const formRef = ref()
const isFormValid = ref(false)

// Hebrew labels for the visitor, enum values for the API
const eventTypes = Object.values(ReservationEventType).map((value) => ({
  title: ReservationEventTypeLabels[value],
  value,
}))

const form = reactive({
  fullName: '',
  phone: '',
  eventType: ReservationEventType.WEDDING,
  eventDate: '',
  guestCount: '',
  location: '',
  notes: '',
  marketingConsent: false,
})

const formattedPhone = ref('')

const phoneInput = computed({
  get: () => formattedPhone.value,
  set: (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    formattedPhone.value = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits
    form.phone = digits
  },
})

// Step navigation
const handleNextStep = async () => {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (valid) {
    currentStep.value = 2
  }
}

const goToStep = (step: 1 | 2) => {
  currentStep.value = step
}

// Final submission
const handleSubmit = async () => {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  const payload: ICreateReservation = {
    fullName: form.fullName.trim(),
    phone: form.phone,
    eventType: form.eventType,
    marketingConsent: form.marketingConsent,
  }

  if (form.eventDate) payload.eventDate = form.eventDate
  if (form.guestCount) payload.guestCount = Number(form.guestCount)
  if (form.location.trim()) payload.location = form.location.trim()
  if (form.notes.trim()) payload.notes = form.notes.trim()

  emit('submit', payload)
}
</script>

<style scoped>
.rf-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  padding: clamp(6px, 1.5vh, 18px) 0;
}

/* Header */
.rf-header {
  text-align: center;
  margin-bottom: clamp(12px, 2vh, 18px);
}

.rf-overline {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.68rem, 1.2vw, 0.8rem);
  letter-spacing: 0.32em;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.rf-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.6rem, 3.6vw, 2.4rem);
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.rf-subtitle {
  font-size: clamp(0.82rem, 1.4vw, 0.92rem);
  color: rgba(255, 255, 255, 0.7);
  margin-top: 6px;
  margin-bottom: 0;
}

/* Stepper */
.rf-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 380px;
  margin-bottom: clamp(14px, 2.2vh, 22px);
  gap: 12px;
}

.rf-step-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: opacity 0.2s ease;
  opacity: 0.45;
}

.rf-step-tab--active {
  opacity: 1;
}

.rf-step-tab--done {
  opacity: 0.8;
}

.rf-step-num {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  color: #ffffff;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.rf-step-tab--active .rf-step-num {
  background: #10b981;
  color: #ffffff;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
}

.rf-step-text {
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffffff;
}

.rf-step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.rf-step-line--active::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #10b981;
  transition: width 0.3s ease;
}

/* Form inputs */
.rf-form {
  width: 100%;
}

.rf-step-content {
  width: 100%;
}

.rf-field :deep(.v-field) {
  background-color: rgba(255, 255, 255, 0.04) !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.rf-field :deep(.v-field--focused) {
  border-color: rgba(16, 185, 129, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
}

.rf-field :deep(.v-field__input),
.rf-field :deep(input),
.rf-field :deep(textarea) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.rf-field.v-input--error :deep(.v-input__details),
.rf-field.v-input--error :deep(.v-messages) {
  color: #f87171 !important;
}

.rf-field :deep(.v-field__outline) {
  display: none !important;
}

.rf-field :deep(.v-label) {
  letter-spacing: 0.03em;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75) !important;
  opacity: 1;
}

.rf-field :deep(.v-field__prepend-inner .v-icon) {
  opacity: 1;
  color: rgba(255, 255, 255, 0.5);
}

/* Actions */
.rf-actions {
  width: 100%;
}

.rf-step2-actions {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}

.rf-submit-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  letter-spacing: 0.06em;
  font-weight: 700;
  border-radius: 12px !important;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.3) !important;
  transition: all 0.25s ease !important;
}

.rf-submit-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.45) !important;
}

.rf-back-btn {
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
  border-radius: 12px !important;
  font-weight: 600;
  transition: all 0.2s ease !important;
}

.rf-back-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.35) !important;
}

.rf-error {
  text-align: center;
  margin-top: 12px;
  font-size: 0.86rem;
  font-weight: 600;
  color: #f87171;
}

.rf-legal-note {
  font-size: 0.78rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin: 10px 0 6px 0;
}

.rf-link {
  color: #38bdf8;
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 500;
  transition: color 0.15s ease;
}

.rf-link:hover {
  color: #7dd3fc;
}

/* Step transition animation */
.rf-slide-enter-active,
.rf-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.rf-slide-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}

.rf-slide-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

@media (max-width: 600px) {
  .rf-field :deep(.v-field) {
    --v-field-padding-start: 10px;
    --v-field-padding-end: 10px;
  }

  .rf-field :deep(.v-label) {
    font-size: clamp(0.68rem, 2.7vw, 0.82rem);
  }

  .rf-field :deep(.v-field__input),
  .rf-field :deep(input) {
    font-size: 0.84rem;
  }

  .rf-field :deep(.v-field__prepend-inner .v-icon) {
    font-size: 1.15rem;
  }
}
</style>
