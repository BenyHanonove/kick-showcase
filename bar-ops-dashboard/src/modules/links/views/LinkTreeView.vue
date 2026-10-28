<template>
  <VThemeProvider theme="dark">
    <div class="lt-page" dir="rtl">
      <!-- Soft ambient glows behind the card -->
      <div class="lt-orbs" aria-hidden="true">
        <span class="lt-orb lt-orb-1" />
        <span class="lt-orb lt-orb-2" />
        <span class="lt-orb lt-orb-3" />
        <span class="lt-orb lt-orb-4" />
      </div>

      <!-- Global Floating Glass Navbar -->
      <LandingNav />

      <main class="lt-main">
        <div class="lt-stack">
          <article class="lt-card">
            <div class="lt-card-inner">
              <img :src="kickLogo" alt="KICK" class="lt-logo" />

              <h1 class="lt-welcome">
                <span class="lt-welcome-text">ברוכים הבאים ל־KICK</span>
                <span class="lt-welcome-glass">🍸</span>
              </h1>

              <p class="lt-sub">בחרו לאן ממשיכים</p>

              <nav class="lt-links">
                <RouterLink to="/self-register" class="lt-link lt-link-primary">
                  <span class="lt-link-label">רוצים לעבוד איתנו</span>
                  <v-icon class="lt-link-arrow">mdi-arrow-left</v-icon>
                </RouterLink>

                <RouterLink to="/reserve" class="lt-link lt-link-secondary">
                  <span class="lt-link-label">רוצים לסגור אירוע</span>
                  <v-icon class="lt-link-arrow">mdi-arrow-left</v-icon>
                </RouterLink>

                <RouterLink to="/" class="lt-link lt-link-ghost">
                  <span class="lt-link-label">לאתר הראשי של KICK</span>
                  <v-icon class="lt-link-arrow">mdi-arrow-left</v-icon>
                </RouterLink>
              </nav>
            </div>
          </article>
        </div>
      </main>

      <AppFooter class="lt-footer" />
    </div>
  </VThemeProvider>
</template>

<script setup lang="ts">
// Public link-tree hub — logo, an animated welcome, and navigation portals
import { VThemeProvider } from 'vuetify/components'
import kickLogo from '@assets/register/kick-white.png'
import LandingNav from '@landing/components/LandingNav.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'
</script>

<style scoped>
.lt-page {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  width: 100%;
  overflow: hidden;
  background-color: #090a0f;
  color: #f3f4f6;
  display: flex;
  flex-direction: column;
}

/* Ambient glowing orbs */
.lt-orbs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.lt-orb {
  position: absolute;
  bottom: -140px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0));
  animation: lt-rise linear infinite;
  filter: blur(20px);
}

.lt-orb-1 {
  right: 12%;
  width: 220px;
  height: 220px;
  animation-duration: 22s;
}

.lt-orb-2 {
  right: 65%;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0));
  animation-duration: 28s;
  animation-delay: -6s;
}

.lt-orb-3 {
  right: 35%;
  width: 280px;
  height: 280px;
  animation-duration: 34s;
  animation-delay: -14s;
}

.lt-orb-4 {
  right: 80%;
  width: 130px;
  height: 130px;
  background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.09), rgba(16, 185, 129, 0));
  animation-duration: 19s;
  animation-delay: -9s;
}

@keyframes lt-rise {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  12% {
    opacity: 0.85;
  }
  88% {
    opacity: 0.85;
  }
  100% {
    transform: translateY(-118vh) translateX(-24px);
    opacity: 0;
  }
}

/* Card sits centred above the orbs */
.lt-main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(96px, 14vh, 130px) clamp(16px, 4vw, 32px) clamp(48px, 8vh, 64px);
}

.lt-stack {
  position: relative;
  width: 100%;
  max-width: 440px;
}

.lt-card {
  position: relative;
  color: #ffffff;
  background: rgba(17, 20, 32, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.lt-card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: clamp(30px, 7vw, 52px) clamp(22px, 6vw, 44px);
}

.lt-logo {
  width: clamp(96px, 26vw, 140px);
  display: block;
  margin-bottom: clamp(20px, 4vh, 34px);
}

/* Welcome floats gently; emerald sheen */
.lt-welcome {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35em;
  margin: 0;
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.4rem, 6.5vw, 2rem);
  letter-spacing: -0.01em;
  animation: lt-float 6s ease-in-out infinite;
}

.lt-welcome-text {
  background: linear-gradient(
    100deg,
    #ffffff 0%,
    #ffffff 40%,
    #10b981 50%,
    #ffffff 60%,
    #ffffff 100%
  );
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: lt-sheen 5.5s linear infinite;
}

.lt-welcome-glass {
  display: inline-block;
  animation: lt-swing 3.4s ease-in-out infinite;
  transform-origin: 50% 85%;
}

@keyframes lt-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes lt-sheen {
  0% {
    background-position: 150% 0;
  }
  100% {
    background-position: -150% 0;
  }
}

@keyframes lt-swing {
  0%,
  100% {
    transform: rotate(-9deg);
  }
  50% {
    transform: rotate(9deg);
  }
}

.lt-sub {
  margin: clamp(8px, 2vh, 14px) 0 clamp(22px, 4vh, 34px);
  font-size: clamp(0.85rem, 3.6vw, 0.98rem);
  color: rgba(255, 255, 255, 0.65);
  letter-spacing: 0.02em;
}

/* Stacked full-width rows — modern pill / rounded cards */
.lt-links {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.4vh, 16px);
}

.lt-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: clamp(14px, 3.4vw, 18px) clamp(18px, 5vw, 24px);
  border-radius: 14px;
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 700;
  font-size: clamp(0.94rem, 4vw, 1.05rem);
  letter-spacing: 0.02em;
  text-decoration: none;
  transition:
    transform 0.22s cubic-bezier(0.22, 0.61, 0.36, 1),
    box-shadow 0.22s ease,
    background-color 0.22s ease,
    border-color 0.22s ease;
}

.lt-link-arrow {
  transition: transform 0.22s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.lt-link:hover {
  transform: translateY(-2px);
}

.lt-link:focus-visible {
  outline: 3px solid #10b981;
  outline-offset: 3px;
}

.lt-link:hover .lt-link-arrow {
  transform: translateX(-5px);
}

.lt-link-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.lt-link-primary:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 12px 30px rgba(16, 185, 129, 0.45);
}

.lt-link-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.lt-link-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.lt-link-ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px dashed rgba(255, 255, 255, 0.18);
}

.lt-link-ghost:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.4);
}

.lt-footer {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .lt-orb,
  .lt-welcome,
  .lt-welcome-text,
  .lt-welcome-glass {
    animation: none;
  }

  .lt-welcome-text {
    color: #ffffff;
  }
}
</style>
