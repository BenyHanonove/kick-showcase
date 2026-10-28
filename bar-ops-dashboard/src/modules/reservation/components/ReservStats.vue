<template>
  <div ref="root" class="rs-panel">
    <p class="rs-eyebrow" dir="ltr">THE NUMBERS</p>

    <div class="rs-grid">
      <div
        v-for="(stat, i) in stats"
        :key="stat.label"
        class="rs-item"
        :class="{ 'rs-divider': i > 0 }"
      >
        <div class="rs-value" dir="ltr">{{ format(counters[i] ?? 0) }}{{ stat.suffix }}</div>
        <div class="rs-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Scale band — mirrors the numbers shown on the careers page
import { ref, onMounted, onBeforeUnmount } from 'vue'

const stats = [
  { target: 400, suffix: '+', label: 'אירועים' },
  { target: 100000, suffix: '+', label: 'אורחים' },
  { target: 500, suffix: '+', label: 'אנשי צוות' },
  { target: 5, suffix: '', label: 'שנות ניסיון' },
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

// Single frame loop drives every counter off one shared progress value
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
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
    { threshold: 0.35 },
  )

  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frameId)
})
</script>

<style scoped>
.rs-panel {
  text-align: center;
}

.rs-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.3vw, 0.8rem);
  letter-spacing: 0.32em;
  color: rgba(26, 26, 26, 0.72);
  margin-bottom: clamp(22px, 4vw, 36px);
}

.rs-grid {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.rs-item {
  padding: 4px clamp(4px, 1.5vw, 16px);
}

.rs-divider {
  border-right: 1px solid rgba(26, 26, 26, 0.15);
}

.rs-value {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(1.2rem, 3.4vw, 2.3rem);
  line-height: 1;
  color: #1a1a1a;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}

.rs-label {
  margin-top: clamp(6px, 1.4vw, 10px);
  font-size: clamp(0.68rem, 1.3vw, 0.8rem);
  font-weight: 700;
  color: rgba(26, 26, 26, 0.72);
}

@media (max-width: 600px) {
  .rs-grid {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 24px;
  }

  .rs-item:nth-child(3) {
    border-right: none;
  }
}
</style>
