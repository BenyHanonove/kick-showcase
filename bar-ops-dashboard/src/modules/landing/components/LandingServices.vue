<template>
  <section class="sv-panel">
    <p class="sv-eyebrow" dir="ltr">COMPREHENSIVE HOSPITALITY</p>
    <h2 class="sv-title">שירותי בר ולוגיסטיקה ללא פשרות</h2>
    <span class="sv-rule" />

    <div class="sv-bento">
      <!-- Bento Card 1: Modular Designed Bars (Large) -->
      <article class="sv-card sv-card--large">
        <div class="sv-card-head">
          <span class="sv-chip">
            <v-icon size="13" class="me-1">mdi-sparkles</v-icon>
            נראות מנצחת
          </span>
          <span class="sv-tag" dir="ltr">MODULAR BARS</span>
        </div>
        <div class="sv-card-content">
          <div class="sv-icon-wrap">
            <v-icon size="28" class="sv-icon">mdi-glass-cocktail</v-icon>
          </div>
          <h3 class="sv-card-title">עמדות בר מעוצבות ומודולריות</h3>
          <p class="sv-card-body">
            מבני בר יוקרתיים המתאימים לכל סגנון אירוע — החל מחתונה כפרית בטבע ועד כנס הייטק מודרני באולם יוקרה. העמדות מגיעות עם תאורה מובנית, עמדות שטיפה, מערכות קירור ומבנה מודולרי שמתכוונן לכל חלל.
          </p>
        </div>
        <div class="sv-card-pills">
          <span class="sv-mini-pill">הקמה ופירוק באותו יום</span>
          <span class="sv-mini-pill">תאורת אווירה מובנית</span>
          <span class="sv-mini-pill">התאמה מלאה לשטח</span>
        </div>
      </article>

      <!-- Bento Card 2: Mixology & Cocktails (Large) -->
      <article class="sv-card sv-card--large sv-card--accent">
        <div class="sv-card-head">
          <span class="sv-chip sv-chip--accent">
            <v-icon size="13" class="me-1">mdi-shaker-outline</v-icon>
            חוויית טעם
          </span>
          <span class="sv-tag" dir="ltr">SIGNATURE MIXOLOGY</span>
        </div>
        <div class="sv-card-content">
          <div class="sv-icon-wrap sv-icon-wrap--accent">
            <v-icon size="28" class="sv-icon sv-icon--accent">mdi-shaker</v-icon>
          </div>
          <h3 class="sv-card-title">מיקסולוגיה ותפריטי קוקטיילים</h3>
          <p class="sv-card-body">
            תפריט משקאות הנבנה בהתאמה אישית עם קוקטיילים ייחודיים שפותחו במיוחד עבור האירוע שלכם. שימוש במחיות פרי טריות, סירופים ביתיים, צמחי תבלין רעננים ואלכוהול פרימיום ביבוא רשמי בלבד.
          </p>
        </div>
        <div class="sv-card-pills">
          <span class="sv-mini-pill">קוקטייל מיתוגי מותאם</span>
          <span class="sv-mini-pill">אופציות Mocktail ללא אלכוהול</span>
          <span class="sv-mini-pill">כוסות קריסטל וזכוכית מעוצבת</span>
        </div>
      </article>

      <!-- Bento Card 3: Smart Tech KICK Platform -->
      <article class="sv-card">
        <div class="sv-card-head">
          <span class="sv-chip">
            <v-icon size="13" class="me-1">mdi-chart-timeline-variant-shimmer</v-icon>
            טכנולוגיה חכמה
          </span>
          <span class="sv-tag" dir="ltr">KICK SYSTEM</span>
        </div>
        <div class="sv-card-content">
          <div class="sv-icon-wrap">
            <v-icon size="24" class="sv-icon">mdi-laptop</v-icon>
          </div>
          <h3 class="sv-card-title">מערכת ניהול KICK</h3>
          <p class="sv-card-body">
            חישוב מלאי מדויק לפי כמות ופרופיל האורחים, מעקב צריכה בזמן אמת ושקט נפשי מוחלט שלא יחסר שום בקבוק במהלך הערב.
          </p>
        </div>
      </article>

      <!-- Bento Card 4: Certified Bartenders & Event Manager -->
      <article class="sv-card">
        <div class="sv-card-head">
          <span class="sv-chip">
            <v-icon size="13" class="me-1">mdi-account-tie</v-icon>
            שירות VIP
          </span>
          <span class="sv-tag" dir="ltr">CREW & MANAGERS</span>
        </div>
        <div class="sv-card-content">
          <div class="sv-icon-wrap">
            <v-icon size="24" class="sv-icon">mdi-account-group</v-icon>
          </div>
          <h3 class="sv-card-title">צוות ברמנים ומנהל אירוע</h3>
          <p class="sv-card-body">
            ברמנים מקצועיים ואנרגטיים שנבחרו והוכשרו בקפידה, בליווי מנהל אירוע בכיר שדואג לכל שלב ומבטיח תורים קצרים וחיוך תמידי.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
// Services Bento Grid with Watermelon UI / shadcn inspiration
</script>

<style scoped>
.sv-panel {
  text-align: center;
}

.sv-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.2vw, 0.78rem);
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 8px;
}

.sv-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.5rem, 3.6vh, 2.4rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.sv-rule {
  display: block;
  width: 50px;
  height: 3px;
  background-color: #a85038;
  margin: clamp(12px, 2vh, 20px) auto clamp(16px, 2.4vh, 26px);
}

/* Watermelon UI Bento Grid */
.sv-bento {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(12px, 1.8vw, 20px);
  text-align: start;
}

.sv-card {
  display: flex;
  flex-direction: column;
  background: rgba(18, 21, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: clamp(16px, 2.2vh, 24px) clamp(16px, 2vw, 24px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sv-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  background: rgba(24, 28, 40, 0.85);
  border-color: rgba(229, 144, 116, 0.35);
}

.sv-card--accent {
  border-color: rgba(168, 80, 56, 0.35);
  background: rgba(28, 20, 24, 0.75);
}

.sv-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sv-chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 8px;
  border-radius: 999px;
}

.sv-chip--accent {
  color: #ff9e85;
  background: rgba(168, 80, 56, 0.25);
}

.sv-tag {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.5);
}

.sv-card-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.sv-icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
}

.sv-icon-wrap--accent {
  background: rgba(168, 80, 56, 0.2);
}

.sv-icon {
  color: #ffffff;
}

.sv-icon--accent {
  color: #ff9e85;
}

.sv-card-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 800;
  font-size: clamp(0.98rem, 1.5vw, 1.15rem);
  color: #ffffff;
  margin: 0 0 6px;
}

.sv-card-body {
  font-size: clamp(0.78rem, 1.25vw, 0.86rem);
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.sv-card-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sv-mini-pill {
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .sv-bento {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
