<template>
  <section class="sv-panel">
    <p class="sv-eyebrow" dir="ltr">WHAT'S INCLUDED</p>
    <h2 class="sv-title">מה נכנס לאירוע</h2>
    <span class="sv-rule" />

    <div class="sv-grid">
      <article v-for="service in services" :key="service.title" class="sv-card">
        <div class="sv-card-inner">
          <v-icon size="26" class="sv-icon">{{ service.icon }}</v-icon>
          <h3 class="sv-card-title">{{ service.title }}</h3>
          <p class="sv-card-body">{{ service.body }}</p>
          <span class="sv-card-tag">{{ service.tag }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
// Service tiles — lift on hover against the section's perspective
const services = [
  {
    icon: 'mdi-glass-cocktail',
    title: 'בר מלא לאירוע',
    body: 'מגיעים עם הכל: אלכוהול, מיקסרים, קרח וכוסות. אתם לא צריכים לקנות שום דבר לפני הערב.',
    tag: 'הכל כלול',
  },
  {
    icon: 'mdi-account-group-outline',
    title: 'צוות ברמנים',
    body: 'מספר הברמנים נקבע לפי כמות האורחים כדי שהתור יישאר קצר, עם אחראי משמרת שמלווה את הערב.',
    tag: 'צוות קבוע ומיומן',
  },
  {
    icon: 'mdi-truck-outline',
    title: 'ציוד ולוגיסטיקה',
    body: 'מבנה הבר, הקירור והחד״פ מגיעים איתנו, מוקמים ומפורקים באותו ערב, גם בשטח פתוח בלי תשתיות.',
    tag: 'מהקמה ועד פירוק',
  },
  {
    icon: 'mdi-book-open-outline',
    title: 'תפריט מותאם',
    body: 'בונים את התפריט לפי הקהל והאופי של הערב, כולל קוקטייל מיתוגי ואופציות ללא אלכוהול.',
    tag: 'בהתאמה אישית',
  },
]
</script>

<style scoped>
.sv-panel {
  text-align: center;
}

.sv-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.3vw, 0.8rem);
  letter-spacing: 0.32em;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 10px;
}

.sv-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 800;
  font-size: clamp(1.6rem, 4vw, 2.6rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.sv-rule {
  display: block;
  width: 56px;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 2px;
  margin: clamp(18px, 3vw, 26px) auto clamp(26px, 4vw, 40px);
}

.sv-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(12px, 2vw, 20px);
  max-width: 960px;
  margin: 0 auto;
}

.sv-card {
  transition: transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.sv-card:hover {
  transform: translateY(-6px);
}

.sv-card-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: clamp(20px, 3vw, 30px) clamp(14px, 2vw, 20px);
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.sv-card:hover .sv-card-inner {
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
}

.sv-icon {
  color: #10b981;
}

.sv-card-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 700;
  font-size: clamp(0.98rem, 1.8vw, 1.12rem);
  color: #ffffff;
  margin: 0;
}

.sv-card-body {
  flex: 1 1 auto;
  font-size: clamp(0.8rem, 1.4vw, 0.88rem);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.sv-card-tag {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 20px;
  padding: 3px 10px;
}

@media (max-width: 900px) {
  .sv-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Phones keep the two-column grid — a 2×2 block fits the snap slide better than
   a four-card stack. The tiles tighten instead of dropping to one per row. */
@media (max-width: 520px) {
  .sv-grid {
    gap: 10px;
  }

  .sv-card-inner {
    gap: 6px;
    padding: 16px 10px;
  }

  .sv-icon {
    /* Overrides the inline font-size the size prop writes on the icon */
    font-size: 21px !important;
  }

  .sv-card-title {
    font-size: 0.9rem;
    line-height: 1.35;
  }

  .sv-card-body {
    font-size: 0.75rem;
    line-height: 1.55;
  }

  .sv-card-tag {
    font-size: 0.53rem;
    letter-spacing: 0.14em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sv-card,
  .sv-card:hover {
    transform: none;
    transition: none;
  }
}
</style>
