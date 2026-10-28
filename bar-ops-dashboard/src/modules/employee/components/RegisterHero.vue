<template>
  <section class="h-wrap">
    <div class="h-panel">
      <img :src="kickLogo" alt="KICK" class="h-logo" />

      <p class="h-eyebrow">WELCOME TO</p>
      <h1 class="h-title">KICK</h1>
      <p class="h-tagline">WE DON'T SERVE DRINKS,<br />WE CREATE MOMENTS.</p>

      <span class="h-join">JOIN THE TEAM</span>
    </div>
  </section>
</template>

<script setup lang="ts">
// Poster-style hero panel for the self registration page
import kickLogo from '@assets/register/kick-white.png'
</script>

<style scoped>
.h-wrap {
  padding: clamp(16px, 3vw, 32px) clamp(16px, 3vw, 32px) 0;
}

.h-panel {
  position: relative;
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(28px, 6vw, 64px) clamp(16px, 5vw, 40px) clamp(48px, 8vw, 80px);
  text-align: center;
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

.h-logo {
  width: clamp(84px, 12vw, 128px);
  margin-bottom: clamp(20px, 4vw, 36px);
}

.h-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.75rem, 1.6vw, 0.95rem);
  letter-spacing: 0.32em;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.h-title {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-weight: 400;
  font-size: clamp(3.2rem, 12vw, 7.5rem);
  line-height: 0.92;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: #ffffff;
  margin: 0 0 clamp(18px, 3vw, 30px);
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.15);
}

.h-tagline {
  font-size: clamp(0.72rem, 1.6vw, 0.95rem);
  font-weight: 600;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.8);
}

.h-join {
  position: absolute;
  top: clamp(16px, 3vw, 28px);
  right: clamp(16px, 3vw, 32px);
  font-size: clamp(0.6rem, 1.2vw, 0.78rem);
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 20px;
  padding: 4px 14px;
}
</style>
