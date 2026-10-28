<template>
  <VThemeProvider theme="dark">
    <div class="sr-page" dir="rtl">
      <!-- Ambient Glows -->
      <div class="sr-glow sr-glow-top" aria-hidden="true" />
      <div class="sr-glow sr-glow-bottom" aria-hidden="true" />

      <!-- Global Floating Glass Navbar -->
      <LandingNav />

      <main class="sr-main" id="main-content" tabindex="-1">
        <div class="sr-container">
          <div v-if="isLoading" class="d-flex justify-center py-16 w-100">
            <v-progress-circular indeterminate size="48" width="3" color="#10b981" />
          </div>

          <RegisterForm
            v-else-if="!isSubmitted"
            :loading="isSubmitting"
            @submit="handleFormSubmit"
          />

          <RegisterSuccess v-else :first-name="submittedName" />
        </div>
      </main>

      <AppFooter class="sr-footer" />
    </div>
  </VThemeProvider>
</template>

<script setup lang="ts">
// Coordinator view for employee self registration — unified focused card
import { ref, onMounted } from 'vue'
import { VThemeProvider } from 'vuetify/components'
import { employeeProvider } from '@employee/providers/employee.provider'
import { useFormSubmit } from '@shared/composables/formSubmit.composable'
import LandingNav from '@landing/components/LandingNav.vue'
import RegisterForm from '@employee/components/RegisterForm.vue'
import RegisterSuccess from '@employee/components/RegisterSuccess.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'
import type { EmployeeGender } from '@employee/types/EmployeeGender.types'

const isLoading = ref(true)
const { loading: isSubmitting, submit } = useFormSubmit()
const isSubmitted = ref(false)
const submittedName = ref('')

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 400)
})

const handleFormSubmit = async (formData: {
  firstName: string
  lastName: string
  identityNumber: string
  phone: string
  gender: EmployeeGender
  instagram: string
  address?: string
  workExperience?: string
}) => {
  await submit(
    () =>
      employeeProvider.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        identityNumber: formData.identityNumber,
        phone: formData.phone,
        gender: formData.gender,
        instagram: formData.instagram,
        address: formData.address || undefined,
        workExperience: formData.workExperience || undefined,
      }),
    {
      onSuccess: () => {
        submittedName.value = formData.firstName?.trim() || ''
        isSubmitted.value = true
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },
    },
  )
}
</script>

<style scoped>
.sr-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background-color: #090a0f;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
}

/* Ambient Radial Glows */
.sr-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
}

.sr-glow-top {
  top: -100px;
  right: 15%;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
}

.sr-glow-bottom {
  bottom: 10%;
  left: 10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%);
}

.sr-main {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: clamp(96px, 14vh, 130px) clamp(16px, 4vw, 32px) clamp(48px, 8vh, 80px);
}

.sr-container {
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.sr-footer {
  position: relative;
  z-index: 1;
}
</style>
