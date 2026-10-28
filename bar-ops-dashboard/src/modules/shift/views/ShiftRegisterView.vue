<template>
  <VThemeProvider theme="dark">
    <div class="lp-page" dir="rtl">
      <!-- Ambient Glows -->
      <div class="sr-glow sr-glow-top" aria-hidden="true" />
      <div class="sr-glow sr-glow-bottom" aria-hidden="true" />

      <!-- Global Floating Glass Navbar -->
      <LandingNav />

      <main class="sr-main">
        <!-- One width cap only; the old col fractions shrank the card to ~320px on desktop -->
        <v-container max-width="560" class="pa-0">
          <div class="sr-panel">
            <img :src="kickLogo" alt="KICK" class="sr-logo" />

            <div class="sr-badge-wrap">
              <span class="sr-tag" dir="ltr">KICK · SHIFT REGISTRATION</span>
            </div>
            <h1 class="sr-title">שיבוץ למשמרת</h1>
            <p class="sr-subtitle">אישור הגעה ובחירת תפקיד למשמרת פעילה</p>
            <span class="sr-rule" />

            <SelfUpdateDots :steps="2" :current="currentStep" class="mb-4" />

            <Transition name="sr-slide" mode="out-in">
              <div v-if="isResolving" key="loading" class="sr-loading">
                <v-progress-circular indeterminate color="#10b981" size="36" />
              </div>

              <InvalidLinkStep
                v-else-if="!resolved"
                key="invalid"
                :message="invalidMessage"
                note="קישור ההרשמה בתוקף ל-24 שעות בלבד. לפרטים נוספים יש לפנות למנהל המשמרת"
              />

              <ShiftRegisterSuccessStep
                v-else-if="registeredRole"
                key="success"
                :first-name="resolved.employee.firstName"
                :role="registeredRole"
                :session="resolved.session"
                :already-registered="resolved.registered"
              />

              <ShiftRegisterFormStep
                v-else
                key="form"
                :token="token"
                :data="resolved"
                @registered="handleRegistered"
                @rejected="handleRejected"
              />
            </Transition>
          </div>
        </v-container>
      </main>

      <AppFooter />
    </div>
  </VThemeProvider>
</template>

<script setup lang="ts">
// Public shift registration coordinator: event + role -> confirmation
// Route is public (meta.isPublic: true); the WhatsApp button's token lives in route.query.token
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VThemeProvider } from 'vuetify/components'
import kickLogo from '@assets/register/kick-white.png'
import LandingNav from '@landing/components/LandingNav.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'
import SelfUpdateDots from '@employee/components/SelfUpdateDots.vue'
import ShiftRegisterFormStep from '@shift/components/ShiftRegisterFormStep.vue'
import ShiftRegisterSuccessStep from '@shift/components/ShiftRegisterSuccessStep.vue'
import InvalidLinkStep from '@shared/components/feedback/InvalidLinkStep.vue'
import { INVALID_LINK_MESSAGE } from '@shared/utils/publicLink.util'
import { shiftProvider } from '@shift/providers/shift.provider'
import type { IResolvedShiftRegistration } from '@shift/types/IShiftRegistration.types'
import type { ShiftRole } from '@shift/types/ShiftRole.types'

const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''

const currentStep = ref(1)
const isResolving = ref(true)
const resolved = ref<IResolvedShiftRegistration | null>(null)
const invalidMessage = ref('')
const registeredRole = ref<ShiftRole | null>(null)

onMounted(async () => {
  if (!token) {
    invalidMessage.value = INVALID_LINK_MESSAGE
    isResolving.value = false
    return
  }

  const result = await shiftProvider.resolveRegistration(token)
  if (result.success && result.data) {
    resolved.value = result.data
    if (result.data.registered) {
      registeredRole.value = result.data.registeredRole ?? null
      currentStep.value = 2
    }
  } else {
    invalidMessage.value = result.message || INVALID_LINK_MESSAGE
  }

  isResolving.value = false
})

function handleRegistered(role: ShiftRole) {
  registeredRole.value = role
  currentStep.value = 2
}

function handleRejected(message: string) {
  invalidMessage.value = message || INVALID_LINK_MESSAGE
  resolved.value = null
  currentStep.value = 1
}
</script>

<style scoped>
.lp-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background-color: #090a0f;
  color: #f3f4f6;
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
  background: radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%);
}

.sr-main {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: clamp(88px, 11vh, 108px) clamp(16px, 4vw, 32px) clamp(24px, 4vh, 40px);
}

.sr-panel {
  position: relative;
  width: 100%;
  text-align: center;
  color: #ffffff;
  background: rgba(17, 20, 32, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: clamp(20px, 3vw, 32px) clamp(20px, 4vw, 36px) clamp(20px, 3vw, 32px);
}

.sr-logo {
  width: clamp(64px, 7vw, 80px);
  margin-bottom: 12px;
}

.sr-badge-wrap {
  margin-bottom: 10px;
}

.sr-tag {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.1vw, 0.76rem);
  letter-spacing: 0.22em;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 3px 12px;
  border-radius: 999px;
  display: inline-block;
}

.sr-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0 0 6px;
}

.sr-subtitle {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
}

.sr-rule {
  display: block;
  width: 56px;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 2px;
  margin: 12px auto 16px;
}

.sr-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

/* Slow slide+fade transition between dot steps */
.sr-slide-enter-active,
.sr-slide-leave-active {
  transition:
    opacity 0.6s cubic-bezier(0.65, 0, 0.35, 1),
    transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}

.sr-slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.sr-slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>
