<template>
  <VThemeProvider theme="dark">
    <div class="auth-page" dir="rtl">
      <!-- Background Ambient Glows -->
      <div class="auth-glow auth-glow-top" aria-hidden="true" />
      <div class="auth-glow auth-glow-bottom" aria-hidden="true" />

      <!-- Global Floating Glass Navbar -->
      <LandingNav />

      <main class="auth-main" id="main-content" tabindex="-1">
        <div class="auth-container">
          <article class="auth-card">
            <!-- Header -->
            <div class="auth-header">
              <img :src="kickLogo" alt="KICK" class="auth-logo" />
              <div class="auth-badge-wrap">
                <span class="auth-tag" dir="ltr">KICK · SYSTEM REGISTRATION</span>
              </div>
              <h1 class="auth-title">הרשמה למערכת</h1>
              <p class="auth-subtitle">
                הצטרפו לנבחרת הניהול של KICK והתחילו לנהל את האירועים והברים בצורה חכמה ויעילה
              </p>
            </div>

            <!-- Form -->
            <v-form @submit.prevent="onRegisterSubmit" ref="form" class="auth-form">
              <div class="auth-row-2 mb-3">
                <AppInput
                  v-model="registerData.firstName"
                  label="שם פרטי"
                  type="text"
                  prepend-inner-icon="mdi-account-outline"
                  name="firstName"
                  autocomplete="given-name"
                  autocapitalize="words"
                  :rules="[rules.required('חובה להזין שם פרטי')]"
                  required
                  class="auth-input"
                />

                <AppInput
                  v-model="registerData.lastName"
                  label="שם משפחה"
                  type="text"
                  prepend-inner-icon="mdi-account-outline"
                  name="lastName"
                  autocomplete="family-name"
                  autocapitalize="words"
                  :rules="[rules.required('חובה להזין שם משפחה')]"
                  required
                  class="auth-input"
                />
              </div>

              <AppInput
                v-model="registerData.email"
                label="אימייל"
                type="email"
                prepend-inner-icon="mdi-email-outline"
                name="email"
                autocomplete="email"
                autocapitalize="off"
                :rules="[rules.required('חובה להזין אימייל'), rules.email()]"
                required
                class="auth-input mb-3"
              />

              <div class="auth-row-2 mb-4">
                <AppInput
                  v-model="registerData.password"
                  label="סיסמה"
                  :type="showPassword ? 'text' : 'password'"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  name="new-password"
                  autocomplete="new-password"
                  :rules="[rules.required('חובה להזין סיסמה')]"
                  required
                  class="auth-input"
                />

                <AppInput
                  v-model="registerData.confirmPassword"
                  label="אימות סיסמה"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  prepend-inner-icon="mdi-lock-check-outline"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  name="confirm-password"
                  autocomplete="new-password"
                  :rules="[
                    rules.required('חובה לאמת סיסמה'),
                    (v) => v === registerData.password || 'הסיסמאות אינן תואמות',
                  ]"
                  required
                  class="auth-input"
                />
              </div>

              <AppButton
                variant="primary"
                class="auth-submit w-100"
                size="large"
                type="submit"
                :loading="loading"
                :disabled="loading"
              >
                <span>הרשמה למערכת</span>
                <v-icon end>mdi-account-plus</v-icon>
              </AppButton>

              <div class="auth-links mt-6">
                <div class="auth-register-wrap">
                  <span class="auth-text-muted">כבר יש לך חשבון?</span>
                  <RouterLink to="/dashboard/login" class="auth-link-register">
                    התחברות
                  </RouterLink>
                </div>
              </div>

              <div class="auth-caption text-center mt-6">
                All authentication services are securely managed by AWS Cognito
              </div>

              <div class="auth-caption text-center mt-2">
                <RouterLink to="/privacy-policy" class="auth-link-privacy">
                  מדיניות פרטיות
                </RouterLink>
              </div>
            </v-form>
          </article>
        </div>
      </main>

      <AppFooter class="auth-footer" />
    </div>
  </VThemeProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VThemeProvider } from 'vuetify/components'
import { useAuthCrud } from '@auth/composables/auth.crud'
import { rules } from '@shared/utils/rules.util'
import AppInput from '@shared/components/input/AppInput.vue'
import LandingNav from '@landing/components/LandingNav.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'
import kickLogo from '@assets/register/kick-white.png'
import type { IRegisterRequest } from '@auth/types/IRequests.types'

const registerData = ref<IRegisterRequest>({
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const { loading, handleRegister } = useAuthCrud()

async function onRegisterSubmit(): Promise<void> {
  if (
    !registerData.value.email ||
    !registerData.value.firstName ||
    !registerData.value.lastName ||
    !registerData.value.password ||
    registerData.value.password !== registerData.value.confirmPassword
  ) {
    return
  }
  await handleRegister(registerData.value)
}
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background-color: #090a0f;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
}

/* Ambient Glows */
.auth-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
}

.auth-glow-top {
  top: -100px;
  right: 15%;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
}

.auth-glow-bottom {
  bottom: 10%;
  left: 10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
}

.auth-main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(96px, 14vh, 130px) clamp(16px, 4vw, 32px) clamp(48px, 8vh, 80px);
}

.auth-container {
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
}

.auth-card {
  background: rgba(17, 20, 32, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: clamp(32px, 6vw, 48px) clamp(22px, 5vw, 36px);
  text-align: center;
}

.auth-logo {
  width: clamp(84px, 14vw, 110px);
  height: auto;
  display: block;
  margin: 0 auto 16px;
}

.auth-badge-wrap {
  margin-bottom: 10px;
}

.auth-tag {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 3px 12px;
  border-radius: 999px;
  display: inline-block;
}

.auth-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.6rem, 3.5vw, 2.1rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0 0 6px;
}

.auth-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 24px;
  line-height: 1.6;
}

.auth-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 540px) {
  .auth-row-2 {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

.auth-submit {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.3) !important;
  transition: all 0.25s ease !important;
  height: 48px !important;
}

.auth-submit:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.45) !important;
  transform: translateY(-1px);
}

.auth-links {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
}

.auth-register-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.auth-text-muted {
  color: rgba(255, 255, 255, 0.55);
}

.auth-link-register {
  color: #10b981;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s ease;
}

.auth-link-register:hover {
  color: #34d399;
  text-decoration: underline;
}

.auth-caption {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
}

.auth-link-privacy {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
}

.auth-link-privacy:hover {
  text-decoration: underline;
}

.auth-footer {
  position: relative;
  z-index: 1;
}
</style>
