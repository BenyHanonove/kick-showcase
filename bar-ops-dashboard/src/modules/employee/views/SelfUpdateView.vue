<template>
  <VThemeProvider theme="dark">
    <div class="lp-page" dir="rtl">
      <!-- Ambient Glows -->
      <div class="su-glow su-glow-top" aria-hidden="true" />
      <div class="su-glow su-glow-bottom" aria-hidden="true" />

      <!-- Global Floating Glass Navbar -->
      <LandingNav />

      <main class="su-main">
        <v-container class="lp-container">
          <v-row align="center" justify="center">
            <v-col cols="12" sm="10" md="8" lg="6">
              <div class="su-panel">
                <img :src="kickLogo" alt="KICK" class="su-logo" />

                <div class="su-badge-wrap">
                  <span class="su-tag" dir="ltr">KICK · EMPLOYEE PROFILE</span>
                </div>
                <h1 class="su-title">עדכון פרטי עובד</h1>
                <p class="su-subtitle">עדכון פרטים אישיים ופרטי קשר במערכת KICK</p>
                <span class="su-rule" />

                <SelfUpdateDots :steps="2" :current="currentStep" class="mb-6" />

                <Transition name="su-slide" mode="out-in">
                  <div v-if="isResolving" key="loading" class="su-loading">
                    <v-progress-circular indeterminate color="#10b981" size="36" />
                  </div>

                  <InvalidLinkStep
                    v-else-if="!resolvedData"
                    key="invalid"
                    note="קישור העדכון בתוקף לשעה אחת בלבד. לקבלת קישור חדש יש לפנות למנהל"
                  />

                  <SelfUpdateFormStep
                    v-else-if="currentStep === 1"
                    key="form"
                    :token="token"
                    :initial-data="resolvedData"
                    @updated="handleUpdated"
                    @rejected="handleRejected"
                  />

                  <SelfUpdateSuccessStep v-else key="success" :first-name="updatedFirstName" />
                </Transition>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </main>

      <AppFooter />
    </div>
  </VThemeProvider>
</template>

<script setup lang="ts">
// Public self-update flow coordinator: employee data -> success
// Route is public (meta.isPublic: true); the link's token lives in route.query.token
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VThemeProvider } from 'vuetify/components'
import kickLogo from '@assets/register/kick-white.png'
import LandingNav from '@landing/components/LandingNav.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'
import SelfUpdateDots from '@employee/components/SelfUpdateDots.vue'
import SelfUpdateFormStep from '@employee/components/SelfUpdateFormStep.vue'
import SelfUpdateSuccessStep from '@employee/components/SelfUpdateSuccessStep.vue'
import InvalidLinkStep from '@shared/components/feedback/InvalidLinkStep.vue'
import { employeeProvider } from '@employee/providers/employee.provider'
import type { ISelfUpdateEmployee } from '@employee/types/IEmployee.types'

const route = useRoute()

const token = typeof route.query.token === 'string' ? route.query.token : ''

const currentStep = ref(1)
const isResolving = ref(true)
const updatedFirstName = ref('')
const resolvedData = ref<ISelfUpdateEmployee | null>(null)

// The token alone identifies the employee; a missing or failed token shows the invalid-link step
onMounted(async () => {
  if (!token) {
    isResolving.value = false
    return
  }

  const result = await employeeProvider.resolve(token)
  if (result.success && result.data) resolvedData.value = result.data
  isResolving.value = false
})

function handleUpdated(firstName: string) {
  updatedFirstName.value = firstName
  currentStep.value = 2
}

// Token expired or was spent while the form was open
function handleRejected() {
  resolvedData.value = null
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
.su-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
}

.su-glow-top {
  top: -100px;
  right: 15%;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
}

.su-glow-bottom {
  bottom: 10%;
  left: 10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%);
}

.su-main {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: clamp(96px, 14vh, 130px) clamp(16px, 4vw, 32px) clamp(48px, 8vh, 80px);
}

.lp-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 0;
}

.su-panel {
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
  padding: clamp(28px, 6vw, 48px) clamp(20px, 4vw, 36px) clamp(32px, 6vw, 48px);
}

.su-logo {
  width: clamp(80px, 12vw, 110px);
  margin-bottom: clamp(16px, 3vw, 22px);
}

.su-badge-wrap {
  margin-bottom: 10px;
}

.su-tag {
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

.su-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0 0 6px;
}

.su-subtitle {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
}

.su-rule {
  display: block;
  width: 56px;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 2px;
  margin: clamp(16px, 2.5vh, 22px) auto clamp(20px, 3vh, 26px);
}

.su-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

/* Slow slide+fade transition between dot steps */
.su-slide-enter-active,
.su-slide-leave-active {
  transition:
    opacity 0.6s cubic-bezier(0.65, 0, 0.35, 1),
    transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}

.su-slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.su-slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>

