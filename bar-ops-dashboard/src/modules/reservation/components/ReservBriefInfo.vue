<template>
  <div ref="root" class="bi-panel">
    <!-- Header: Anton eyebrow + bold Hebrew heading -->
    <header class="bi-header">
      <p class="bi-eyebrow" dir="ltr">EVENT BRIEF</p>
      <h2 class="bi-title">ספרו לנו על האירוע</h2>
      <span class="bi-rule" />
      <p class="bi-lead">
        אחרי שליחת הפרטים אנחנו מרימים אליכם טלפון. נשמע על האירוע, נבין מה צריך ונחזור אליכם עם
        הצעה מותאמת אישית ללא שום התחייבות.
      </p>
    </header>

    <!-- The Numbers metric band -->
    <section class="bi-stats-section" aria-label="נתוני פעילות">
      <p class="bi-stats-label" dir="ltr">THE NUMBERS</p>
      <div class="bi-stats-grid">
        <div
          v-for="(stat, i) in stats"
          :key="stat.label"
          class="bi-stat-card"
          :class="{ 'bi-stat-divider': i > 0 }"
        >
          <div class="bi-stat-value" dir="ltr">{{ format(counters[i] ?? 0) }}{{ stat.suffix }}</div>
          <div class="bi-stat-name">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- Additional information & value highlights -->
    <section class="bi-values-grid" aria-label="מה כולל השירות">
      <article v-for="item in highlights" :key="item.title" class="bi-value-card">
        <div class="bi-value-icon-wrap">
          <v-icon size="22" color="#10b981">{{ item.icon }}</v-icon>
        </div>
        <div class="bi-value-content">
          <h3 class="bi-value-title">{{ item.title }}</h3>
          <p class="bi-value-desc">{{ item.desc }}</p>
        </div>
      </article>
    </section>

    <!-- Call to action to jump to form -->
    <div class="bi-action">
      <AppButton
        class="bi-cta"
        size="x-large"
        variant="flat"
        rounded="0"
        @click.stop="emit('continue')"
      >
        <span>המשיכו למילוי הפרטים</span>
        <v-icon end>mdi-arrow-down</v-icon>
      </AppButton>
      <span class="bi-hint">מילוי מהיר — לוקח פחות מדקה</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AppButton from '@shared/components/layout/AppButton.vue'

const emit = defineEmits<{
  (e: 'continue'): void
}>()

// The Numbers data
const stats = [
  { target: 400, suffix: '+', label: 'אירועים' },
  { target: 100000, suffix: '+', label: 'אורחים' },
  { target: 500, suffix: '+', label: 'אנשי צוות' },
  { target: 5, suffix: '', label: 'שנות ניסיון' },
]

// Standout service pillars
const highlights = [
  {
    icon: 'mdi-lightning-bolt-outline',
    title: 'מענה מהיר',
    desc: 'שיחה אישית ומקצועית להבנת אופי האירוע, התאמת הכמויות וסגנון הבר.',
  },
  {
    icon: 'mdi-shield-check-outline',
    title: 'מחיר סגור ושקוף',
    desc: 'הכל כלול: אלכוהול מובחר, ציוד מלא, קרח, כוסות וביטוח — בלי הפתעות בסוף הערב.',
  },
  {
    icon: 'mdi-glass-cocktail',
    title: 'תפריט קוקטיילים בהתאמה',
    desc: 'בונים תפריט מוקפד לפי טעמכם, כולל אופציות מיוחדות ומרעננות ללא אלכוהול.',
  },
  {
    icon: 'mdi-account-tie-outline',
    title: 'שקט נפשי וניהול צמוד',
    desc: 'אחראי משמרת מלווה את כל האירוע, צוות מיומן וציוד גיבוי לכל תרחיש.',
  },
]

const COUNT_DURATION = 1800
const root = ref<HTMLElement | null>(null)
const counters = ref<number[]>(stats.map(() => 0))
let observer: IntersectionObserver | null = null
let frameId = 0

const format = (value: number) => value.toLocaleString('en-US')
const easeOut = (progress: number) => 1 - Math.pow(1 - progress, 3)

const settle = () => {
  counters.value = stats.map((stat) => stat.target)
}

const countUp = () => {
  const start = performance.now()
  const step = (now: number) => {
    const progress = Math.min((now - start) / COUNT_DURATION, 1)
    const eased = easeOut(progress)
    counters.value = stats.map((stat) => Math.round(stat.target * eased))
    if (progress < 1) frameId = requestAnimationFrame(step)
  }
  frameId = requestAnimationFrame(step)
}

onMounted(() => {
  const prefersReduced =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  if (prefersReduced || !('IntersectionObserver' in window) || !root.value) {
    settle()
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting) return
      observer?.disconnect()
      countUp()
    },
    { threshold: 0.25 },
  )

  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frameId)
})
</script>

<style scoped>
.bi-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: clamp(8px, 1.5vh, 20px) 0;
}

/* Header typography */
.bi-header {
  max-width: 720px;
  margin: 0 auto;
}

.bi-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.3vw, 0.8rem);
  letter-spacing: 0.32em;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.bi-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.6rem, 3.8vw, 2.6rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0;
}

.bi-rule {
  display: block;
  width: 52px;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 2px;
  margin: clamp(12px, 1.8vh, 18px) auto;
}

.bi-lead {
  font-size: clamp(0.85rem, 1.6vw, 0.98rem);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

/* The Numbers section */
.bi-stats-section {
  width: 100%;
  margin-top: clamp(16px, 2.5vh, 28px);
  padding: clamp(14px, 2vh, 20px) clamp(12px, 2vw, 24px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(8px);
}

.bi-stats-label {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: 0.68rem;
  letter-spacing: 0.32em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}

.bi-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
}

.bi-stat-card {
  padding: 4px 10px;
}

.bi-stat-divider {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.bi-stat-value {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(1.3rem, 3.2vw, 2.2rem);
  line-height: 1;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 16px rgba(16, 185, 129, 0.25);
}

.bi-stat-name {
  margin-top: 4px;
  font-size: clamp(0.7rem, 1.2vw, 0.82rem);
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

/* Value Highlights Grid */
.bi-values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(10px, 1.5vw, 16px);
  width: 100%;
  margin-top: clamp(14px, 2.2vh, 24px);
  text-align: start;
}

.bi-value-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: clamp(12px, 1.5vh, 16px) clamp(14px, 1.8vw, 20px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.bi-value-card:hover {
  transform: translateY(-2px);
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.bi-value-icon-wrap {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(16, 185, 129, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.bi-value-content {
  flex: 1;
}

.bi-value-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 800;
  font-size: clamp(0.85rem, 1.4vw, 0.98rem);
  color: #ffffff;
  margin: 0 0 2px 0;
}

.bi-value-desc {
  font-size: clamp(0.74rem, 1.1vw, 0.82rem);
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

/* Action Area */
.bi-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: clamp(16px, 2.5vh, 26px);
  width: 100%;
}

.bi-cta {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  letter-spacing: 0.06em;
  font-weight: 700;
  font-size: 0.92rem;
  padding: 0 32px;
  height: 48px;
  min-width: 260px;
  border-radius: 12px !important;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.3) !important;
  transition: all 0.25s ease !important;
}

.bi-cta:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.45) !important;
}

.bi-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Responsive adjustments */
@media (max-width: 700px) {
  .bi-panel {
    margin-block: auto;
    margin-inline: auto;
    padding: 0;
  }

  .bi-eyebrow {
    font-size: 0.66rem;
    letter-spacing: 0.28em;
    margin-bottom: 3px;
  }

  .bi-title {
    font-size: clamp(1.25rem, 4.6vw, 1.55rem);
    line-height: 1.12;
  }

  .bi-rule {
    width: 34px;
    height: 2px;
    margin: 6px auto;
  }

  .bi-lead {
    font-size: 0.76rem;
    line-height: 1.36;
    max-width: 330px;
    margin: 0 auto;
  }

  .bi-stats-section {
    margin-top: 7px;
    padding: 5px 8px;
    border-radius: 4px;
  }

  .bi-stats-label {
    font-size: 0.56rem;
    letter-spacing: 0.24em;
    margin-bottom: 4px;
  }

  .bi-stats-grid {
    grid-template-columns: repeat(4, 1fr);
    align-items: center;
  }

  .bi-stat-card {
    padding: 1px 3px;
  }

  .bi-stat-divider {
    border-right: 1px solid rgba(26, 26, 26, 0.15);
  }

  .bi-stat-value {
    font-size: clamp(0.95rem, 3.4vw, 1.18rem);
    line-height: 1;
  }

  .bi-stat-name {
    margin-top: 2px;
    font-size: 0.63rem;
    white-space: nowrap;
  }

  .bi-values-grid {
    grid-template-columns: 1fr;
    gap: 5px;
    margin-top: 7px;
  }

  .bi-value-card {
    padding: 6px 10px;
    gap: 8px;
    border-radius: 4px;
  }

  .bi-value-icon-wrap {
    width: 26px;
    height: 26px;
    min-width: 26px;
    border-radius: 3px;
  }

  .bi-value-icon-wrap :deep(.v-icon) {
    font-size: 16px !important;
  }

  .bi-value-title {
    font-size: 0.8rem;
    line-height: 1.2;
    margin: 0 0 2px 0;
  }

  .bi-value-desc {
    font-size: 0.7rem;
    line-height: 1.32;
    display: block;
    overflow: visible;
  }

  .bi-action {
    margin-top: 8px;
    gap: 3px;
  }

  .bi-cta {
    width: 100%;
    max-width: 290px;
    min-width: unset;
    height: 40px !important;
    font-size: 0.86rem;
    padding: 0 18px;
  }

  .bi-hint {
    font-size: 0.68rem;
  }
}

@media (max-width: 360px), (max-height: 640px) {
  .bi-title {
    font-size: 1.22rem;
  }

  .bi-lead {
    font-size: 0.72rem;
    line-height: 1.3;
  }

  .bi-stats-section {
    margin-top: 6px;
    padding: 5px 6px;
  }

  .bi-values-grid {
    margin-top: 7px;
    gap: 5px;
  }

  .bi-value-card {
    padding: 6px 10px;
  }

  .bi-value-title {
    font-size: 0.78rem;
  }

  .bi-value-desc {
    font-size: 0.68rem;
    line-height: 1.28;
  }

  .bi-action {
    margin-top: 8px;
  }

  .bi-cta {
    height: 38px !important;
  }
}
</style>
