<template>
  <section class="ab-panel">
    <p class="ab-eyebrow" dir="ltr">ABOUT KICK</p>
    <h2 class="ab-title">סטנדרט חדש של אירוח, מיקסולוגיה ותפעול</h2>
    <span class="ab-rule" />

    <p class="ab-lead">
      אנחנו לא מספקים רק אלכוהול — אנחנו יוצרים את המוקד המרכזי של הערב. עם שילוב של מיקסולוגיה יצירתית, תפעול קפדני וטכנולוגיית ניהול מתקדמת, אנחנו מבטיחים שכל אורח יקבל משקה מעולה תוך שניות ספורות.
    </p>

    <div class="ab-grid">
      <!-- Story Card -->
      <article class="ab-card">
        <div class="ab-card-icon-wrap">
          <v-icon size="24" class="ab-icon">mdi-history</v-icon>
        </div>
        <h3 class="ab-card-title">הניסיון והמקצועיות</h3>
        <p class="ab-card-text">
          במהלך 5 השנים האחרונות ניהלנו ברים במעל 400 אירועים בכל רחבי הארץ. למדנו לתכנן כל פרט מראש כדי למנוע צווארי בקבוק ותורים מעייפים.
        </p>
        <div class="ab-card-footer">
          <span class="ab-card-badge">מעל 400 אירועים</span>
        </div>
      </article>

      <!-- Weddings & Private -->
      <article class="ab-card ab-card--highlight">
        <div class="ab-card-icon-wrap">
          <v-icon size="24" class="ab-icon">mdi-glass-flute</v-icon>
        </div>
        <h3 class="ab-card-title">חתונות ואירועים פרטיים</h3>
        <p class="ab-card-text">
          תפריט מותאם לזוג ולאורחים, קוקטייל חתימה ייחודי, עמדות מעוצבות באסתטיקה מוקפדת, וצוות ברמנים שיודע להרים את האנרגיה ברחבה.
        </p>
        <div class="ab-card-footer">
          <span class="ab-card-badge">חוויה בלתי נשכחת</span>
        </div>
      </article>

      <!-- Corporate & Large Scale -->
      <article class="ab-card">
        <div class="ab-card-icon-wrap">
          <v-icon size="24" class="ab-icon">mdi-office-building-cog</v-icon>
        </div>
        <h3 class="ab-card-title">חברות והפקות ענק</h3>
        <p class="ab-card-text">
          מענה לוגיסטי מלא לאלפי משתתפים באירועי חברה, כנסי הייטק ופסטיבלים. יכולת הקמה בכל שטח, כולל מקומות ללא תשתיות מים או חשמל.
        </p>
        <div class="ab-card-footer">
          <span class="ab-card-badge">יכולת תפעול ארצית</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
// About Us presentation section
</script>

<style scoped>
.ab-panel {
  text-align: center;
}

.ab-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.2vw, 0.78rem);
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 8px;
}

.ab-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.5rem, 3.6vh, 2.4rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.ab-rule {
  display: block;
  width: 50px;
  height: 3px;
  background-color: #a85038;
  margin: clamp(12px, 2vh, 20px) auto clamp(14px, 2.2vh, 24px);
}

.ab-lead {
  max-width: 780px;
  margin: 0 auto clamp(16px, 2.5vh, 28px);
  font-size: clamp(0.86rem, 1.4vw, 0.98rem);
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.75);
}

.ab-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(12px, 2vw, 22px);
  text-align: start;
}

.ab-card {
  display: flex;
  flex-direction: column;
  background: rgba(18, 21, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: clamp(16px, 2.4vh, 24px) clamp(14px, 2vw, 20px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.ab-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  background: rgba(24, 28, 40, 0.85);
  border-color: rgba(229, 144, 116, 0.35);
}

.ab-card--highlight {
  border-color: rgba(168, 80, 56, 0.35);
  background: rgba(26, 20, 25, 0.75);
}

.ab-card-icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(168, 80, 56, 0.2);
  margin-bottom: 14px;
}

.ab-icon {
  color: #ff9e85;
}

.ab-card-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 800;
  font-size: clamp(1rem, 1.6vw, 1.15rem);
  color: #ffffff;
  margin: 0 0 8px;
}

.ab-card-text {
  font-size: clamp(0.8rem, 1.3vw, 0.88rem);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  flex: 1 1 auto;
}

.ab-card-footer {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.ab-card-badge {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  color: #ff9e85;
  font-weight: 600;
}

@media (max-width: 820px) {
  .ab-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
