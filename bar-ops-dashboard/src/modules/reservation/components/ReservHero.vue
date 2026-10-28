<template>
  <div class="hero">
    <!-- Letterhead -->
    <header class="hero-head">
      <img :src="kickLogo" alt="KICK" class="hero-logo" />
    </header>

    <span class="hero-rule" />

    <h1 class="hero-title">
      האירוע שלכם.<br />
      הבר שלנו.
    </h1>

    <div class="hero-body">
      <!-- מי אנחנו -->
      <p>
        אנחנו KICK — שירותי בר לאירועים והפקות. כבר 5 שנים אנחנו מקימים ברים באירועים
        בכל הארץ, מחתונות ואירועי חברה ועד ההפקות הגדולות ביותר בארץ.
      </p>

      <!-- מה אנחנו עושים — החוויה, לא הרשימה -->
      <p>
        הבר הוא לא פינת שתייה — הוא חלק מהחוויה של הערב. אנחנו בונים עמדה שנעים לעמוד לידה,
        צוות שיודע לדבר עם האורחים, ותפריט שמתאים לקהל שלכם. האורחים זוכרים את הכוס שקיבלו,
        לא את ההמתנה אליה.
      </p>

      <!-- למה אנחנו -->
      <p>
        אחרי מעל 400 אירועים אנחנו כבר יודעים מה משתבש לפני שזה משתבש: כמה ברמנים באמת צריך
        לכמות האורחים, כמה מלאי להביא, ואיך שומרים על תור קצר גם בשעת השיא.
      </p>
    </div>

    <footer class="hero-sign">
      <p class="hero-sign-off">בברכה,</p>
      <p class="hero-sign-name">צוות KICK</p>
      <p class="hero-sign-legal">KICK שירותי בר בע"מ</p>
    </footer>

    <div class="hero-actions">
      <AppButton class="hero-cta" size="x-large" variant="flat" rounded="0" @click="emit('reserve')">
        השאירו פרטים לאירוע
        <v-icon end>mdi-arrow-left</v-icon>
      </AppButton>

      <AppButton
        class="hero-ghost"
        size="x-large"
        variant="outlined"
        rounded="0"
        @click="emit('explore')"
      >
        מה כולל השירות
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// Hero brief — modern dark aesthetic for event reservation
import kickLogo from '@assets/register/kick-white.png'

const emit = defineEmits<{
  (e: 'reserve'): void
  (e: 'explore'): void
}>()
</script>

<style scoped>
.hero {
  text-align: start;
}

/* Letterhead */
.hero-head {
  display: flex;
  align-items: center;
}

.hero-logo {
  width: clamp(64px, 8vw, 96px);
  display: block;
}

.hero-rule {
  display: block;
  width: 100%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.12);
  margin: clamp(12px, 2vh, 24px) 0 clamp(14px, 2.2vh, 30px);
}

.hero-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.7rem, 4.2vh, 3rem);
  line-height: 1.02;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0 0 clamp(10px, 2vh, 22px);
}

.hero-body {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.4vh, 16px);
}

.hero-body p {
  font-size: clamp(0.88rem, 1.5vw, 1.02rem);
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

.hero-sign {
  margin-top: clamp(12px, 2.2vh, 28px);
}

.hero-sign-off {
  font-size: clamp(0.86rem, 1.5vw, 1rem);
  color: rgba(255, 255, 255, 0.7);
}

.hero-sign-name {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 800;
  font-size: clamp(1rem, 2vw, 1.24rem);
  color: #ffffff;
  margin-top: 2px;
}

.hero-sign-legal {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.58rem, 1.1vw, 0.7rem);
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 6px;
}

.hero-actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: clamp(10px, 2vw, 18px);
  margin-top: clamp(16px, 2.6vh, 34px);
  padding-top: clamp(14px, 2.2vh, 30px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hero-cta,
.hero-ghost {
  min-width: 0 !important;
  font-size: clamp(0.64rem, 2.4vw, 0.95rem) !important;
  letter-spacing: clamp(0.01em, 0.35vw, 0.08em) !important;
  padding-inline: clamp(8px, 2.4vw, 24px) !important;
  border-radius: 12px !important;
  transition: all 0.25s ease !important;
}

.hero-cta :deep(.v-icon) {
  font-size: 1.15em;
  margin-inline-start: clamp(2px, 1vw, 8px) !important;
}

.hero-cta {
  flex: 3 1 0;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  letter-spacing: 0.08em;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.3) !important;
}

.hero-cta:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.45) !important;
}

.hero-ghost {
  flex: 2 1 0;
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.hero-ghost:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.35) !important;
}

.hero-cta :deep(.v-btn__overlay),
.hero-ghost :deep(.v-btn__overlay) {
  display: none;
}

@media (max-width: 480px) {
  .hero-body p {
    line-height: 1.7;
  }
}
</style>
