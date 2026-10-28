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
                <span class="auth-tag" dir="ltr">KICK · RESET PASSWORD</span>
              </div>
              <h1 class="auth-title">איפוס סיסמה</h1>
              <p class="auth-subtitle">
                הזינו את הקוד שקיבלתם במייל ובחרו סיסמה חדשה למערכת
              </p>
            </div>

            <!-- Form -->
            <v-form @submit.prevent="onConfirmSubmit" ref="form" class="auth-form">
              <AppInput
                v-model="formData.code"
                label="קוד אימות"
                type="text"
                prepend-inner-icon="mdi-numeric"
                :rules="[(v) => !!v || 'חובה להזין את הקוד']"
                required
                class="auth-input mb-3"
              />

              <AppInput
                v-model="formData.password"
                label="סיסמה חדשה"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="[(v) => !!v || 'חובה להזין סיסמה']"
                required
                class="auth-input mb-3"
              />

              <AppInput
                v-model="formData.confirmPassword"
                label="אימות סיסמה חדשה"
                type="password"
                prepend-inner-icon="mdi-lock-check-outline"
                :rules="[
                  (v) => !!v || 'חובה לאמת סיסמה',
                  (v) => v === formData.password || 'הסיסמאות אינן תואמות',
                ]"
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
                <span>עדכן סיסמה</span>
                <v-icon end>mdi-check</v-icon>
              </AppButton>

              <div class="auth-links mt-6">
                <RouterLink to="/dashboard/login" class="auth-link-back">
                  <v-icon size="16" class="me-1">mdi-arrow-right</v-icon>
                  <span>חזרה להתחברות</span>
                </RouterLink>
              </div>

              <div class="auth-caption text-center mt-6">
                All authentication services are securely managed by AWS Cognito
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
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { VThemeProvider } from 'vuetify/components'
import { useAuthCrud } from '@auth/composables/auth.crud'
import AppInput from '@shared/components/input/AppInput.vue'
import LandingNav from '@landing/components/LandingNav.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'
import kickLogo from '@assets/register/kick-white.png'

const route = useRoute()

const showPassword = ref(false)
const email = typeof route.query.email === 'string' ? route.query.email : ''

const formData = reactive({
  code: '',
  password: '',
  confirmPassword: '',
})

const { loading, handleConfirmRestore } = useAuthCrud()

async function onConfirmSubmit(): Promise<void> {
  await handleConfirmRestore(email, formData.code, formData.password)
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
  justify-content: center;
  font-size: 0.82rem;
}

.auth-link-back {
  display: inline-flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.auth-link-back:hover {
  color: #10b981;
}

.auth-caption {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
}

.auth-footer {
  position: relative;
  z-index: 1;
}
</style>
