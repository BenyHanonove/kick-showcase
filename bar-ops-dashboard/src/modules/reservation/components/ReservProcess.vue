<template>
  <section class="pr-inner">
    <div>
      <p class="pr-eyebrow" dir="ltr">FROM FIRST CALL TO LAST POUR</p>
      <h2 class="pr-title">איך זה עובד</h2>

      <ol ref="track" class="pr-track" :style="{ '--pr-progress': railProgress }">
        <li
          v-for="(step, i) in steps"
          :key="step.title"
          class="pr-step"
          :class="{ 'pr-step--done': i < doneCount }"
        >
          <span class="pr-index" dir="ltr">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="pr-node" aria-hidden="true" />
          <h3 class="pr-step-title">{{ step.title }}</h3>
          <p class="pr-step-body">{{ step.body }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
// Booking sequence — numbered because the order is the information
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const steps = [
  {
    title: 'משאירים פרטים',
    body: 'ממלאים את הטופס עם הפרטים הבסיסיים. לא צריך לדעת בשלב הזה את כל מה שיהיה בערב.',
  },
  {
    title: 'שיחת אפיון',
    body: 'מרימים אליכם טלפון, שומעים על הקהל ועל המקום, וסוגרים יחד תפריט וגודל צוות.',
  },
  {
    title: 'הצעת מחיר',
    body: 'שולחים הצעה מפורטת: אלכוהול, צוות וציוד באותו מחיר, בלי תוספות בסוף הערב.',
  },
  {
    title: 'יום האירוע',
    body: 'מגיעים מראש, מקימים את הבר ובודקים שהכול עובד. בסוף הערב מפרקים ומפנים אחרינו.',
  },
]

// Steps light up one after the other once the track scrolls into view
const STAGGER_MS = 340

const track = ref<HTMLElement | null>(null)
const doneCount = ref(0)
let observer: IntersectionObserver | null = null
const timers: ReturnType<typeof setTimeout>[] = []

// The rail connects node centers, so it is full only when the last step lights up
const railProgress = computed(() =>
  steps.length > 1 ? Math.max(0, doneCount.value - 1) / (steps.length - 1) : doneCount.value,
)

const runSequence = () => {
  steps.forEach((_, i) => {
    timers.push(setTimeout(() => (doneCount.value = i + 1), i * STAGGER_MS))
  })
}

onMounted(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced || !('IntersectionObserver' in window) || !track.value) {
    doneCount.value = steps.length
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting) return
      runSequence()
      observer?.disconnect()
    },
    { threshold: 0.35 },
  )

  observer.observe(track.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  timers.forEach(clearTimeout)
})
</script>

<style scoped>
.pr-inner {
  text-align: center;
  --pr-live: #10b981;
  --pr-index-size: clamp(1.6rem, 3.4vw, 2.4rem);
  --pr-node-center: calc(var(--pr-index-size) + 18.5px);
}

.pr-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.64rem, 1.3vw, 0.78rem);
  letter-spacing: 0.32em;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 10px;
}

.pr-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 800;
  font-size: clamp(1.6rem, 4vw, 2.6rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0 0 clamp(34px, 5vw, 56px);
}

.pr-track {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(16px, 2.5vw, 28px);
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Rail the step nodes sit on */
.pr-track::before {
  content: '';
  position: absolute;
  top: calc(var(--pr-node-center) - 0.5px);
  right: 12%;
  left: 12%;
  height: 1px;
  background: linear-gradient(
    to left,
    transparent,
    rgba(255, 255, 255, 0.15) 12%,
    rgba(255, 255, 255, 0.15) 88%,
    transparent
  );
}

/* Green fill chasing the nodes; grows one segment per step that lights up */
.pr-track::after {
  content: '';
  position: absolute;
  top: calc(var(--pr-node-center) - 1px);
  right: 12%;
  left: 12%;
  height: 2px;
  background-color: var(--pr-live);
  transform: scaleX(var(--pr-progress, 0));
  transform-origin: right center;
  transition: transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* Steps wait in a faded state until the sequence reaches them */
.pr-step {
  position: relative;
  padding: 0 clamp(4px, 1vw, 12px);
  opacity: 0.35;
  transform: translateY(16px);
  transition:
    opacity 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.pr-step--done {
  opacity: 1;
  transform: none;
}

.pr-index {
  display: block;
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: var(--pr-index-size);
  line-height: 1;
  color: rgba(255, 255, 255, 0.2);
  transition: color 0.55s ease;
}

.pr-step--done .pr-index {
  color: var(--pr-live);
}

/* Node styling */
.pr-node {
  display: block;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background-color: #111420;
  margin: 12px auto 20px;
  transition:
    background-color 0.45s ease,
    border-color 0.45s ease,
    box-shadow 0.45s ease,
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pr-step--done .pr-node {
  background-color: var(--pr-live);
  border-color: var(--pr-live);
  box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.25);
  transform: scale(1.15);
}

.pr-step-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 700;
  font-size: clamp(0.98rem, 1.8vw, 1.14rem);
  color: #ffffff;
  margin: 0 0 8px;
}

.pr-step-body {
  font-size: clamp(0.8rem, 1.4vw, 0.88rem);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

@media (max-width: 800px) {
  .pr-track {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 34px;
  }

  .pr-track::before,
  .pr-track::after {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pr-step,
  .pr-node,
  .pr-index,
  .pr-track::after {
    transition: none;
    transform: none;
  }
}
</style>
