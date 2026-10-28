<template>
  <VThemeProvider theme="dark">
    <div class="rv-page" dir="rtl">
      <!-- Background Ambient Glows -->
      <div class="rv-glow rv-glow-top" aria-hidden="true" />
      <div class="rv-glow rv-glow-bottom" aria-hidden="true" />

      <!-- Global Floating Glass Navbar -->
      <LandingNav />

      <main class="rv-main" id="main-content" tabindex="-1">
        <div class="rv-container">
          <!-- Single Unified Reservation Card -->
          <article class="rv-card">
            <!-- Header section inside card -->
            <header class="rv-card-header">
              <div class="rv-badge-wrap">
                <span class="rv-tag" dir="ltr">KICK · EVENT RESERVATION</span>
              </div>

              <h1 class="rv-title">הזמנת בר לאירוע שלכם</h1>
              <p class="rv-subtitle">
                שירותי בר פרימיום, מיקסולוגיה מתקדמת, צוותי ברמנים מקצועיים וציוד מלא מקצה לקצה.
                השאירו פרטים ונחזור אליכם עם הצעה מדויקת המותאמת לאירוע שלכם.
              </p>

              <!-- Value Pills Row -->
              <div class="rv-pills">
                <span class="rv-pill">
                  <v-icon size="14" class="me-1">mdi-clock-fast</v-icon>
                  מענה מהיר תוך 24 שעות
                </span>
                <span class="rv-pill">
                  <v-icon size="14" class="me-1">mdi-glass-cocktail</v-icon>
                  תפריט קוקטיילים מותאם אישית
                </span>
                <span class="rv-pill">
                  <v-icon size="14" class="me-1">mdi-shield-check-outline</v-icon>
                  ציוד מלא ואלכוהול פרימיום
                </span>
                <span class="rv-pill">
                  <v-icon size="14" class="me-1">mdi-map-marker-radius-outline</v-icon>
                  בפריסה ארצית מלאה
                </span>
              </div>

              <span class="rv-divider" />
            </header>

            <!-- Direct Form Section -->
            <section class="rv-form-body">
              <ReservForm
                v-if="!isSubmitted"
                :loading="isSubmitting"
                :error-message="submitError"
                @submit="handleSubmit"
              />
              <ReservSuccess v-else :first-name="submittedName" />
            </section>
          </article>
        </div>
      </main>

      <AppFooter class="rv-footer" />
    </div>
  </VThemeProvider>
</template>

<script setup lang="ts">
// Public reservation portal: focused single-card experience
import { ref } from 'vue'
import { VThemeProvider } from 'vuetify/components'
import { reservationProvider } from '@reservation/providers/reservation.provider'
import type { ICreateReservation } from '@reservation/types/IReservation.types'
import LandingNav from '@landing/components/LandingNav.vue'
import ReservForm from '@reservation/components/ReservForm.vue'
import ReservSuccess from '@reservation/components/ReservSuccess.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'

const isSubmitted = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submittedName = ref('')

const handleSubmit = async (payload: ICreateReservation) => {
  isSubmitting.value = true
  submitError.value = ''

  const result = await reservationProvider.create(payload)

  isSubmitting.value = false

  if (!result.success) {
    submitError.value = result.message || 'שליחת הפרטים נכשלה, נסו שוב בעוד רגע'
    return
  }

  submittedName.value = payload.fullName.split(' ')[0] ?? ''
  isSubmitted.value = true
}
</script>

<style scoped>
.rv-page {
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
.rv-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
}

.rv-glow-top {
  top: -100px;
  right: 15%;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
}

.rv-glow-bottom {
  bottom: 10%;
  left: 10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
}

.rv-main {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: clamp(96px, 14vh, 130px) clamp(16px, 4vw, 32px) clamp(48px, 8vh, 80px);
}

.rv-container {
  max-width: 920px;
  margin: 0 auto;
  width: 100%;
}

/* Unified Frosted Card */
.rv-card {
  position: relative;
  background: rgba(17, 20, 32, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: clamp(28px, 5vw, 48px) clamp(20px, 5vw, 44px);
}

.rv-card-header {
  text-align: start;
  margin-bottom: clamp(20px, 3vh, 32px);
}

.rv-badge-wrap {
  margin-bottom: 12px;
}

.rv-tag {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.1vw, 0.78rem);
  letter-spacing: 0.24em;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 4px 12px;
  border-radius: 999px;
  display: inline-block;
}

.rv-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.8rem, 4vh, 2.8rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0 0 10px;
}

.rv-subtitle {
  font-size: clamp(0.88rem, 1.4vw, 1.02rem);
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.72);
  margin: 0 0 clamp(16px, 2.5vh, 24px);
  max-width: 780px;
}

.rv-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: clamp(16px, 2.5vh, 24px);
}

.rv-pill {
  display: inline-flex;
  align-items: center;
  font-size: clamp(0.72rem, 1.1vw, 0.8rem);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 999px;
}

.rv-divider {
  display: block;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.4), rgba(255, 255, 255, 0.08));
}

.rv-form-body {
  width: 100%;
}

.rv-footer {
  position: relative;
  z-index: 1;
}
</style>
