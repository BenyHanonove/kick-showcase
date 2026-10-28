<template>
  <div class="st-panel">
    <p class="st-eyebrow">THE NUMBERS</p>
    <div class="st-grid">
      <div v-for="(stat, i) in stats" :key="stat.label" class="st-item" :class="{ 'st-divider': i > 0 }">
        <div class="st-value">{{ stat.value }}</div>
        <div class="st-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Poster-style stats band, based on the "THE NUMBERS" reference asset
const stats = [
  { value: '400+', label: 'EVENTS' },
  { value: '100,000+', label: 'GUESTS SERVED' },
  { value: '500+', label: 'TEAM MEMBERS' },
  { value: '5', label: 'YEARS OF EXPERIENCE' },
]
</script>

<style scoped>
.st-panel {
  background: rgba(17, 20, 32, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: clamp(28px, 5vw, 48px) clamp(16px, 4vw, 32px);
  text-align: center;
}

.st-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-weight: 400;
  font-size: clamp(1.4rem, 3.4vw, 2rem);
  letter-spacing: 0.06em;
  color: #ffffff;
  margin-bottom: clamp(24px, 4vw, 40px);
}

.st-grid {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.st-item {
  padding: 4px clamp(4px, 1.5vw, 16px);
}

.st-divider {
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.st-value {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-weight: 400;
  font-size: clamp(1.1rem, 3.2vw, 2.2rem);
  color: #ffffff;
  line-height: 1;
  text-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
}

.st-label {
  margin-top: clamp(6px, 1.4vw, 10px);
  font-size: clamp(0.5rem, 1.3vw, 0.72rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.65);
}

@media (max-width: 600px) {
  .st-grid {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 20px;
  }

  .st-divider:nth-child(odd) {
    border-left: none;
  }
}
</style>
