<template>
  <div class="hero">
    <!-- Letterhead -->
    <header class="hero-head">
      <div class="hero-logo-box">
        <img :src="kickLogo" alt="KICK שירותי בר" class="hero-logo" />
      </div>
    </header>

    <span class="hero-rule" />

    <div class="hero-badge-row">
      <span class="hero-pill">
        <v-icon size="13" class="me-1">mdi-star-four-points</v-icon>
        מעל 400 אירועים מוצלחים
      </span>
      <span class="hero-pill">
        <v-icon size="13" class="me-1">mdi-shield-check-outline</v-icon>
        שירות וציוד מקצה לקצה
      </span>
      <span class="hero-pill">
        <v-icon size="13" class="me-1">mdi-clock-fast</v-icon>
        תפעול לוגיסטי מדויק
      </span>
      <span class="hero-pill">
        <v-icon size="13" class="me-1">mdi-map-marker-radius-outline</v-icon>
        בפריסה ארצית מלאה
      </span>
    </div>

    <h1 class="hero-title">
      האירוע שלכם.<br />
      <span class="hero-title-accent">הבר והדיוק שלנו.</span>
    </h1>

    <div class="hero-body">
      <p>
        אנחנו <strong>KICK</strong> — החברה המובילה בישראל לשירותי בר פרימיום, מיקסולוגיה והפקת חוויות אלכוהול מתקדמות. כבר מעל 5 שנים אנחנו מקימים עמדות בר מעוצבות, מביאים צוותי ברמנים מהשורה הראשונה, ומספקים ציוד מלא לחתונות, אירועי חברות ענק, פסטיבלים והפקות יוקרה.
      </p>
      <p>
        עם מערכת הניהול התפעולית הבלעדית שלנו, אנחנו מחשבים מראש כמויות מדויקות, מנטרים את המלאי בזמן אמת ושומרים על זמני המתנה אפסיים — כך שהאורחים שלכם נהנים מכוס קוקטייל מושלמת ושירות ללא פשרות.
      </p>
    </div>

    <div class="hero-actions">
      <RouterLink to="/reserve" class="hero-cta">
        <span>הזמנת בר מלא לאירוע</span>
        <v-icon end size="18">mdi-arrow-left</v-icon>
      </RouterLink>

      <RouterLink to="/self-register" class="hero-ghost">
        <v-icon start size="16">mdi-account-plus-outline</v-icon>
        <span>בוא לעבוד איתנו</span>
      </RouterLink>

      <button type="button" class="hero-ghost" @click="emit('explore')">
        <span>מה כולל השירות</span>
        <v-icon end size="16">mdi-arrow-down</v-icon>
      </button>
    </div>

    <footer class="hero-sign">
      <div class="hero-sign-wrap">
        <p class="hero-sign-legal" dir="ltr">KICK BAR SERVICES & PRODUCTION LTD.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import kickLogo from '@assets/register/kick-white.png'

const emit = defineEmits<{
  (e: 'explore'): void
}>()
</script>

<style scoped>
.hero {
  text-align: start;
}

.hero-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: clamp(6px, 1vh, 12px);
}

.hero-logo-box {
  display: flex;
  align-items: center;
}

.hero-logo {
  width: clamp(140px, 20vw, 220px);
  height: auto;
  display: block;
}

.hero-rule {
  display: block;
  width: 100%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: clamp(10px, 1.8vh, 20px) 0 clamp(12px, 2vh, 22px);
}

.hero-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: clamp(10px, 1.8vh, 18px);
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  font-size: clamp(0.7rem, 1.1vw, 0.78rem);
  font-weight: 700;
  color: #ffc2b3;
  background: rgba(168, 80, 56, 0.2);
  border: 1px solid rgba(229, 144, 116, 0.35);
  padding: 3px 10px;
  border-radius: 999px;
}

.hero-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.8rem, 4.4vh, 3.2rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0 0 clamp(10px, 2vh, 20px);
}

.hero-title-accent {
  background: linear-gradient(135deg, #ffffff 20%, #ff9e85 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-body {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.3vh, 14px);
}

.hero-body p {
  font-size: clamp(0.88rem, 1.5vw, 1.02rem);
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.76);
  margin: 0;
}



.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(8px, 1.5vw, 14px);
  margin-top: clamp(16px, 2.5vh, 28px);
  padding-top: clamp(12px, 2vh, 24px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #a85038;
  border: 1px solid #e59074;
  color: #ffffff;
  font-weight: 700;
  font-size: clamp(0.82rem, 1.3vw, 0.95rem);
  padding: clamp(10px, 1.6vh, 14px) clamp(16px, 2.4vw, 28px);
  border-radius: 6px;
  text-decoration: none;
  box-shadow: 0 10px 24px rgba(168, 80, 56, 0.4);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-cta:hover {
  background-color: #c25e42;
  border-color: #ff9e85;
  box-shadow: 0 12px 28px rgba(168, 80, 56, 0.6);
  transform: translateY(-2px);
}

.hero-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 600;
  font-size: clamp(0.82rem, 1.3vw, 0.92rem);
  padding: clamp(9px, 1.5vh, 13px) clamp(14px, 2vw, 22px);
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.hero-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff;
}

.hero-sign {
  margin-top: clamp(14px, 2.2vh, 26px);
}

.hero-sign-wrap {
  border-inline-start: 3px solid #a85038;
  padding-inline-start: 12px;
}

.hero-sign-legal {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.55rem, 1vw, 0.68rem);
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

@media (max-width: 580px) {
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .hero-subtle {
    margin-inline-start: 0;
    justify-content: center;
  }
}
</style>
