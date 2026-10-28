<template>
  <section class="st-panel">
    <p class="st-eyebrow" dir="ltr">PROVEN TRACK RECORD</p>
    <h2 class="st-title">המספרים שמדברים בעד עצמם</h2>
    <span class="st-rule" />

    <p class="st-lead">
      מאחורי כל אירוע מוצלח עומדים תכנון מדויק, צוות מיומן ושליטה מלאה בכל בקבוק. הנה כמה נתונים שמספרים את הסיפור שלנו:
    </p>

    <div class="st-grid">
      <article v-for="stat in stats" :key="stat.label" class="st-card">
        <div class="st-card-glow" />
        <div class="st-icon-wrap">
          <v-icon size="24" :color="stat.iconColor">{{ stat.icon }}</v-icon>
        </div>
        <span class="st-num" dir="ltr">{{ stat.value }}</span>
        <h3 class="st-label">{{ stat.label }}</h3>
        <p class="st-sub">{{ stat.sub }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const stats = [
  {
    value: '400+',
    label: 'אירועים מוצלחים',
    sub: 'חתונות, אירועי חברה והפקות ענק ברחבי ישראל',
    icon: 'mdi-party-popper',
    iconColor: '#a85038',
  },
  {
    value: '99.8%',
    label: 'שביעות רצון',
    sub: 'דירוג ממוצע ע״י מפיקים, חברות וזוגות מתחתנים',
    icon: 'mdi-star-face',
    iconColor: '#d19f3d',
  },
  {
    value: '100%',
    label: 'שקט נפשי למפיק',
    sub: 'אחריות מלאה מהקמת עמדות הבר ועד הפירוק בסוף הלילה',
    icon: 'mdi-shield-check',
    iconColor: '#4a7c59',
  },
  {
    value: '50+',
    label: 'מתכוני קוקטיילים',
    sub: 'תפריטי מיקסולוגיה בהתאמה אישית לכל קהל ואירוע',
    icon: 'mdi-glass-cocktail',
    iconColor: '#6b7c59',
  },
]
</script>

<style scoped>
.st-panel {
  text-align: center;
}

.st-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.2vw, 0.78rem);
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 8px;
}

.st-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.5rem, 3.6vh, 2.4rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.st-rule {
  display: block;
  width: 50px;
  height: 3px;
  background-color: #a85038;
  margin: clamp(12px, 2vh, 20px) auto clamp(14px, 2.2vh, 24px);
}

.st-lead {
  max-width: 720px;
  margin: 0 auto clamp(16px, 2.5vh, 26px);
  font-size: clamp(0.86rem, 1.4vw, 0.96rem);
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.75);
}

.st-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(10px, 1.8vw, 18px);
}

.st-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(16px, 2.5vh, 26px) clamp(12px, 1.6vw, 18px);
  background: rgba(18, 21, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.st-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.4);
  background: rgba(24, 28, 40, 0.85);
  border-color: rgba(229, 144, 116, 0.35);
}

.st-card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(229, 144, 116, 0.6), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.st-card:hover .st-card-glow {
  opacity: 1;
}

.st-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
}

.st-num {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(1.8rem, 3.8vh, 2.6rem);
  line-height: 1;
  letter-spacing: 0.02em;
  color: #ffffff;
  margin-bottom: 6px;
}

.st-label {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 800;
  font-size: clamp(0.9rem, 1.3vw, 1.05rem);
  color: #ffffff;
  margin: 0 0 4px;
}

.st-sub {
  font-size: clamp(0.72rem, 1.1vw, 0.8rem);
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
}

@media (max-width: 900px) {
  .st-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .st-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
