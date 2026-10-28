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
                <span class="auth-tag" dir="ltr">KICK · SYSTEM LOGIN</span>
              </div>
              <h1 class="auth-title">כניסה למערכת</h1>
              <p class="auth-subtitle">הזינו את פרטי ההתחברות כדי להיכנס למערכת הניהול של KICK</p>
            </div>

            <!-- Form -->
            <v-form @submit.prevent="onLoginSubmit" ref="form" class="auth-form">
              <AppInput
                v-model="loginData.email"
                label="אימייל"
                type="email"
                autocomplete="username"
                prepend-inner-icon="mdi-email-outline"
                :rules="[rules.required('חובה להזין אימייל'), rules.email()]"
                required
                class="auth-input mb-3"
              />

              <AppInput
                v-model="loginData.password"
                label="סיסמה"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="[(v) => !!v || 'חובה להזין סיסמה']"
                required
                class="auth-input mb-4"
              />

              <AppButton
                variant="primary"
                class="auth-submit w-100"
                size="large"
                type="submit"
                :loading="loading"
                :disabled="loading"
              >
                <span>התחברות למערכת</span>
                <v-icon end>mdi-login</v-icon>
              </AppButton>

              <div class="auth-links mt-6">
                <RouterLink to="/dashboard/restore" class="auth-link-forgot">
                  שכחת סיסמה?
                </RouterLink>
                <div class="auth-register-wrap">
                  <span class="auth-text-muted">עדיין אין לך חשבון?</span>
                  <RouterLink to="/dashboard/register" class="auth-link-register">
                    הרשמה למערכת
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
import type { ILoginRequest } from '@auth/types/IRequests.types'

const loginData = ref<ILoginRequest>({ email: '', password: '' })
const showPassword = ref(false)

const { loading, handleLogin } = useAuthCrud()

const onLoginSubmit = async () => {
  if (!loginData.value.email || !loginData.value.password) return
  await handleLogin(loginData.value)
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
  max-width: 480px;
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
  justify-content: space-between;
  font-size: 0.82rem;
  flex-wrap: wrap;
  gap: 8px;
}

.auth-link-forgot {
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  transition: color 0.2s ease;
}

.auth-link-forgot:hover {
  color: #ffffff;
  text-decoration: underline;
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
