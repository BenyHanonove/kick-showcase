<template>
  <div class="su-dots" role="progressbar" :aria-valuenow="current" :aria-valuemax="steps">
    <span
      v-for="step in steps"
      :key="step"
      class="su-dot"
      :class="{
        'su-dot--active': step === current,
        'su-dot--done': step < current,
      }"
    />
  </div>
</template>

<script setup lang="ts">
// Slow-animated step indicator: active dot grows, completed dots fill in
withDefaults(
  defineProps<{
    steps: number
    current: number
  }>(),
  { steps: 3, current: 1 },
)
</script>

<style scoped>
.su-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.su-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  transition:
    width 0.6s cubic-bezier(0.65, 0, 0.35, 1),
    background-color 0.6s ease,
    transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}

.su-dot--done {
  background-color: #10b981;
  opacity: 0.6;
}

.su-dot--active {
  width: 26px;
  border-radius: 999px;
  background-color: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  transform: scale(1.05);
}
</style>
