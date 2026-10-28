<template>
  <div class="f-panel">
    <div class="f-grid">
      <!-- Heading column -->
      <div class="f-heading">
        <div class="f-logo-wrap">
          <img :src="kickLogo" alt="KICK" class="f-logo" />
        </div>
        <span class="f-tag" dir="ltr">KICK · JOIN THE TEAM</span>
        <h2 class="f-title">בואו לעבוד<br />איתנו באירועים</h2>
        <span class="f-rule" />

        <p class="f-desc">
          אנחנו מחפשים ברמנים ואנשי שירות מצוינים לאירועי יוקרה, חתונות והפקות ענק בכל הארץ. שכר
          מתגמל, אווירה מעולה וגמישות מלאה.
        </p>

        <div class="f-pills">
          <span class="f-pill">
            <v-icon size="14" class="me-1">mdi-currency-ils</v-icon>
            שכר מתגמל וטיפים מעולים
          </span>
          <span class="f-pill">
            <v-icon size="14" class="me-1">mdi-glass-cocktail</v-icon>
            אירועי יוקרה והפקות ענק
          </span>
          <span class="f-pill">
            <v-icon size="14" class="me-1">mdi-calendar-check-outline</v-icon>
            גמישות מלאה בשיבוץ
          </span>
        </div>
      </div>

      <!-- Fields column (Hebrew, RTL) -->
      <div class="f-fields" dir="rtl">
        <v-form ref="formRef" v-model="isFormValid" @submit.prevent="handleSubmit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <AppInput
                v-model="form.firstName"
                label="שם פרטי*"
                type="text"
                class="f-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rules="[rules.required('חובה להזין שם פרטי')]"
                prepend-inner-icon="mdi-account-outline"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <AppInput
                v-model="form.lastName"
                label="שם משפחה*"
                type="text"
                class="f-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rules="[rules.required('חובה להזין שם משפחה')]"
                prepend-inner-icon="mdi-account-outline"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <AppInput
                v-model="form.identityNumber"
                label="תעודת זהות (9 ספרות)*"
                type="text"
                class="f-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rules="[
                  rules.required('חובה להזין תעודת זהות'),
                  rules.israeliId('תעודת זהות חייבת להכיל 9 ספרות בדיוק'),
                ]"
                prepend-inner-icon="mdi-card-account-details-outline"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <AppInput
                v-model="phoneInput"
                label="טלפון נייד*"
                type="tel"
                class="f-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rules="[
                  rules.required('חובה להזין טלפון'),
                  rules.israeliPhone('מספר הטלפון אינו תקין'),
                ]"
                prepend-inner-icon="mdi-phone-outline"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12">
              <AppInput
                v-model="form.gender"
                label="מגדר*"
                type="select"
                :items="genderItems"
                class="f-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rules="[rules.required('חובה לבחור מגדר')]"
                prepend-inner-icon="mdi-gender-male-female"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12">
              <AppInput
                v-model="form.instagram"
                label="אינסטגרם*"
                type="text"
                class="f-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rules="[
                  rules.required('חובה להזין אינסטגרם'),
                  rules.instagramHandle('שם המשתמש אינו תקין'),
                ]"
                prepend-inner-icon="mdi-instagram"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12">
              <AppInput
                v-model="form.address"
                label="עיר / כתובת מגורים"
                type="text"
                class="f-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                prepend-inner-icon="mdi-map-marker-outline"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12">
              <AppInput
                v-model="form.workExperience"
                label="ניסיון קודם בברים / אירועים (לא חובה)"
                type="textarea"
                class="f-field"
                base-color="rgba(255, 255, 255, 0.4)"
                color="#ffffff"
                :rows="3"
                prepend-inner-icon="mdi-briefcase-outline"
                hide-details="auto"
              />
            </v-col>
          </v-row>

          <p class="f-legal-note">
            בלחיצה על הרשמה הנך מאשר/ת את
            <RouterLink to="/terms" class="f-link">תנאי השימוש</RouterLink>
            ואת
            <RouterLink to="/privacy-policy" class="f-link">מדיניות הפרטיות</RouterLink>
          </p>

          <AppButton
            type="submit"
            class="f-submit"
            block
            size="x-large"
            variant="flat"
            rounded="lg"
            :loading="loading"
            :disabled="!isFormValid || loading"
          >
            <span>שליחת פרטים והצטרפות לנבחרת</span>
            <v-icon end>mdi-arrow-left</v-icon>
          </AppButton>

          <p class="f-tagline">תביאו איתכם אנרגיה טובה — אנחנו נדאג לכל השאר.</p>
        </v-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Registration form for the self registration page — same business logic as v1
import { ref, reactive, computed } from 'vue'
import { rules } from '@shared/utils/rules.util'
import AppInput from '@shared/components/input/AppInput.vue'
import kickLogo from '@assets/register/kick-white.png'
import { EmployeeGender, EmployeeGenderLabels } from '@employee/types/EmployeeGender.types'

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (
    e: 'submit',
    data: {
      firstName: string
      lastName: string
      identityNumber: string
      phone: string
      gender: EmployeeGender
      instagram: string
      address?: string
      workExperience?: string
    },
  ): void
}>()

const formRef = ref()
const isFormValid = ref(false)

const genderItems = Object.entries(EmployeeGenderLabels).map(([value, title]) => ({
  title,
  value: value as EmployeeGender,
}))

const form = reactive({
  firstName: '',
  lastName: '',
  identityNumber: '',
  phone: '',
  gender: null as EmployeeGender | null,
  instagram: '',
  address: '',
  workExperience: '',
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

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid || !form.gender) return

  emit('submit', {
    firstName: form.firstName,
    lastName: form.lastName,
    identityNumber: form.identityNumber,
    phone: form.phone,
    gender: form.gender,
    instagram: form.instagram,
    address: form.address || undefined,
    workExperience: form.workExperience || undefined,
  })
}
</script>

<style scoped>
.f-panel {
  background: rgba(17, 20, 32, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: clamp(24px, 4vw, 48px);
}

.f-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.3fr;
  gap: 56px;
  align-items: start;
}

.f-heading {
  padding-top: 8px;
  text-align: start;
}

.f-logo-wrap {
  margin-bottom: 16px;
}

.f-logo {
  width: clamp(100px, 14vw, 150px);
  height: auto;
  display: block;
}

.f-tag {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: 0.74rem;
  letter-spacing: 0.24em;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 4px 12px;
  border-radius: 999px;
  display: inline-block;
  margin-bottom: 14px;
}

.f-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.8rem, 3.2vw, 2.6rem);
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0 0 14px;
}

.f-rule {
  display: block;
  width: 56px;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 2px;
  margin: 14px 0 16px;
}

.f-desc {
  font-size: 0.88rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 20px;
}

.f-pills {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
}

.f-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 14px;
  border-radius: 999px;
  width: fit-content;
  white-space: nowrap;
  flex-shrink: 0;
}

.f-field :deep(.v-field) {
  background-color: rgba(255, 255, 255, 0.04) !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.f-field :deep(.v-field--focused) {
  border-color: rgba(16, 185, 129, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
}

.f-field :deep(.v-field__input),
.f-field :deep(input),
.f-field :deep(textarea) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.f-field.v-input--error :deep(.v-input__details),
.f-field.v-input--error :deep(.v-messages) {
  color: #f87171 !important;
}

.f-field :deep(.v-field__outline) {
  display: none !important;
}

.f-field :deep(.v-label) {
  letter-spacing: 0.05em;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75) !important;
  opacity: 1;
}

.f-field :deep(.v-field__prepend-inner .v-icon) {
  opacity: 1;
  color: rgba(255, 255, 255, 0.5);
}

.f-submit {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  letter-spacing: 0.14em;
  font-weight: 700;
  border-radius: 12px !important;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.3) !important;
  transition: all 0.25s ease !important;
}

.f-submit:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.45) !important;
}

.f-submit :deep(.v-btn__overlay) {
  display: none;
}

.f-submit.v-btn--disabled {
  opacity: 0.5 !important;
}

.f-tagline {
  text-align: center;
  margin-top: 14px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.f-legal-note {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin: 12px 0;
}

.f-link {
  color: #38bdf8;
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 500;
  transition: color 0.15s ease;
}

.f-link:hover {
  color: #7dd3fc;
}

@media (max-width: 900px) {
  .f-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
