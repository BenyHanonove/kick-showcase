<template>
  <section class="pr-panel">
    <p class="pr-eyebrow" dir="ltr">HOW IT WORKS</p>
    <h2 class="pr-title">תהליך העבודה: שקט מוחלט לכל אורך הדרך</h2>
    <span class="pr-rule" />

    <p class="pr-lead">
      כל אירוע מקבל תוכנית תפעולית מסודרת. אתם מתרכזים באורחים, ואנחנו דואגים לכל מה שקשור לבר:
    </p>

    <div class="pr-steps">
      <div v-for="(step, idx) in steps" :key="step.title" class="pr-step">
        <div class="pr-step-header">
          <span class="pr-step-num" dir="ltr">0{{ idx + 1 }}</span>
          <div class="pr-step-icon">
            <v-icon size="20" color="#a85038">{{ step.icon }}</v-icon>
          </div>
        </div>
        <h3 class="pr-step-title">{{ step.title }}</h3>
        <p class="pr-step-desc">{{ step.desc }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    title: 'שיחת אפיון והתאמה',
    desc: 'נבין ביחד את כמות האורחים, סגנון האירוע, העדפות הטעם והתקציב, ונבנה את החבילה המדויקת.',
    icon: 'mdi-phone-in-talk-outline',
  },
  {
    title: 'תפריט ועיצוב העמדות',
    desc: 'בניית תפריט קוקטיילים חתימה, בחירת מותגי האלכוהול, והתאמת מבנה עמדות הבר לקונספט העיצובי.',
    icon: 'mdi-clipboard-list-outline',
  },
  {
    title: 'לוגיסטיקה והקמה בשטח',
    desc: 'הצוות מגיע שעות לפני תחילת האירוע, פורק ציוד, מקרר משקאות ומכין מחיות וקישוטים טריים.',
    icon: 'mdi-truck-delivery-outline',
  },
  {
    title: 'חוויית שירות ופירוק נקי',
    desc: 'ברמנים חייכנים, קצב עבודה מהיר למניעת תורים, ובסיום הערב פירוק מוקפד והשארת המקום נקי לחלוטין.',
    icon: 'mdi-sparkles-outline',
  },
]
</script>

<style scoped>
.pr-panel {
  text-align: center;
}

.pr-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.2vw, 0.78rem);
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 8px;
}

.pr-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.5rem, 3.6vh, 2.4rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.pr-rule {
  display: block;
  width: 50px;
  height: 3px;
  background-color: #a85038;
  margin: clamp(12px, 2vh, 20px) auto clamp(14px, 2.2vh, 24px);
}

.pr-lead {
  max-width: 720px;
  margin: 0 auto clamp(16px, 2.5vh, 26px);
  font-size: clamp(0.86rem, 1.4vw, 0.96rem);
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.75);
}

.pr-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(12px, 1.8vw, 20px);
  text-align: start;
}

.pr-step {
  display: flex;
  flex-direction: column;
  padding: clamp(16px, 2.4vh, 24px) clamp(14px, 1.8vw, 20px);
  background: rgba(18, 21, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.pr-step:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  background: rgba(24, 28, 40, 0.85);
  border-color: rgba(229, 144, 116, 0.35);
}

.pr-step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pr-step-num {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.05em;
}

.pr-step-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(168, 80, 56, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pr-step-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 800;
  font-size: clamp(0.95rem, 1.4vw, 1.1rem);
  color: #ffffff;
  margin: 0 0 6px;
}

.pr-step-desc {
  font-size: clamp(0.78rem, 1.2vw, 0.85rem);
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  flex: 1 1 auto;
}

@media (max-width: 900px) {
  .pr-steps {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .pr-steps {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
