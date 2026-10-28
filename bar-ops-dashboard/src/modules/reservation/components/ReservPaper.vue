<template>
  <div class="rp-wrapper">
    <article class="rp-card">
      <div class="rp-card-inner">
        <slot />
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
// Modern dark frosted card container for reservation sections
</script>

<style scoped>
.rp-wrapper {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.rp-card {
  position: relative;
  background: rgba(17, 20, 32, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  color: #f3f4f6;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.rp-card:hover {
  border-color: rgba(16, 185, 129, 0.2);
  box-shadow:
    0 30px 70px rgba(0, 0, 0, 0.6),
    0 0 30px rgba(16, 185, 129, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.rp-card-inner {
  padding: clamp(24px, 4vw, 48px) clamp(20px, 4vw, 44px);
  display: flex;
  flex-direction: column;
}
</style>
