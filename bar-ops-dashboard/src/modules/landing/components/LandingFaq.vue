<template>
  <section class="faq-panel">
    <p class="faq-eyebrow" dir="ltr">FAQ & INFORMATION</p>
    <h2 class="faq-title">שאלות נפוצות ותשובות ברורות</h2>
    <span class="faq-rule" />

    <p class="faq-lead">
      כל מה שחשוב לדעת לפני שסוגרים שירותי בר לאירוע שלכם:
    </p>

    <div class="faq-list">
      <article
        v-for="(item, index) in faqItems"
        :key="index"
        class="faq-item"
        :class="{ 'faq-item--open': activeIndex === index }"
      >
        <button
          type="button"
          class="faq-question"
          :aria-expanded="activeIndex === index"
          @click="toggle(index)"
        >
          <span class="faq-q-text">{{ item.question }}</span>
          <v-icon size="20" class="faq-icon">
            {{ activeIndex === index ? 'mdi-minus' : 'mdi-plus' }}
          </v-icon>
        </button>

        <div v-show="activeIndex === index" class="faq-answer">
          <p>{{ item.answer }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeIndex = ref<number | null>(0)

const toggle = (index: number) => {
  activeIndex.value = activeIndex.value === index ? null : index
}

const faqItems = [
  {
    question: 'איך נקבעת כמות האלכוהול לאירוע?',
    answer:
      'אנחנו משתמשים במודל התפעולי הבלעדי של KICK, המשקלל את מספר האורחים, פרופיל הגילאים, עונת השנה, אופי האירוע ושעות הפעילות. בנוסף, אנחנו תמיד מביאים רזרבות ביטחון כדי להבטיח שאף משקה לא ייגמר במהלך הלילה.',
  },
  {
    question: 'האם השירות כולל קרח, כוסות וציוד מלא?',
    answer:
      'כן, הכל כלול מקצה לקצה! אנחנו מספקים עמדות בר מעוצבות, כוסות זכוכית איכותיות או כוסות מתכלות יוקרתיות לפי בחירתכם, קרח ללא הגבלה (קוביות וגרוס), פירות, מחיות טריות, קשים וכל הציוד המקצועי.',
  },
  {
    question: 'האם אתם מפיקים ברים גם בשטח פתוח ללא תשתיות?',
    answer:
      'בהחלט. יש לנו ניסיון עשיר בהפקות שטח, חופים, יערות ומקומות ללא נקודות מים או חשמל ישירות. אנו מגיעים עם ציוד שטח עצמאי ופתרונות קירור מתקדמים.',
  },
  {
    question: 'האם יש אפשרות לקוקטיילים ללא אלכוהול (Mocktails)?',
    answer:
      'בוודאי. אנו מרכיבים תפריט מוקטיילים מיוחד המבוסס על פירות רעננים, צמחי תבלין ומיצים טבעיים, כך שכל אורח שלא שותה אלכוהול מקבל חוויית משקה ייחודית ומרהיבה.',
  },
  {
    question: 'מתי מומלץ לשריין תאריך ואיך מתקדמים?',
    answer:
      'מומלץ לשריין תאריך בהקדם האפשרי, בפרט בעונות השיא. משאירים פרטים בטופס ההזמנה, ומנהל אירוע חוזר אליכם לשיחת היכרות ובניית הצעת מחיר מסודרת.',
  },
]
</script>

<style scoped>
.faq-panel {
  text-align: center;
}

.faq-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.2vw, 0.78rem);
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 8px;
}

.faq-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.5rem, 3.6vh, 2.4rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.faq-rule {
  display: block;
  width: 50px;
  height: 3px;
  background-color: #a85038;
  margin: clamp(12px, 2vh, 20px) auto clamp(14px, 2.2vh, 24px);
}

.faq-lead {
  max-width: 720px;
  margin: 0 auto clamp(16px, 2.4vh, 24px);
  font-size: clamp(0.86rem, 1.4vw, 0.96rem);
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.75);
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 860px;
  margin: 0 auto;
  text-align: start;
}

.faq-item {
  background: rgba(18, 21, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  backdrop-filter: blur(12px);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.faq-item:hover {
  background: rgba(24, 28, 40, 0.85);
  border-color: rgba(255, 255, 255, 0.2);
}

.faq-item--open {
  background: rgba(26, 30, 44, 0.95);
  border-color: rgba(229, 144, 116, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: clamp(12px, 1.8vh, 16px) clamp(14px, 2vw, 20px);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: start;
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 700;
  font-size: clamp(0.92rem, 1.4vw, 1.05rem);
  color: #ffffff;
  transition: color 0.2s ease;
}

.faq-icon {
  color: #ff9e85;
  flex: 0 0 auto;
}

.faq-answer {
  padding: 0 clamp(14px, 2vw, 20px) clamp(14px, 2vh, 18px);
}

.faq-answer p {
  margin: 0;
  font-size: clamp(0.82rem, 1.25vw, 0.9rem);
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.75);
}
</style>
