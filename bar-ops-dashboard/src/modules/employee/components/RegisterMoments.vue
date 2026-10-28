<template>
  <div class="m-panel">
    <p class="m-eyebrow">SOME OF THE MOMENTS WE'VE CREATED</p>

    <div class="m-stage">
      <button class="m-nav m-nav-prev" type="button" aria-label="Previous" @click="prevPage">
        <v-icon size="20">mdi-chevron-left</v-icon>
      </button>

      <div class="m-page">
        <img
          v-if="!brokenSlots[pageIndex]"
          :src="moments[pageIndex]"
          alt="רגע מאירוע של KICK"
          class="m-media"
          loading="lazy"
          @error="onImageError(pageIndex)"
        />
        <div v-else class="m-placeholder">
          <v-icon size="30" class="m-placeholder-icon">mdi-image-outline</v-icon>
        </div>
      </div>

      <button class="m-nav m-nav-next" type="button" aria-label="Next" @click="nextPage">
        <v-icon size="20">mdi-chevron-right</v-icon>
      </button>
    </div>

    <div class="m-dots">
      <button
        v-for="(m, i) in moments"
        :key="m"
        type="button"
        class="m-dot"
        :class="{ 'm-dot-active': i === pageIndex }"
        :aria-label="`Go to page ${i + 1}`"
        @click="goToPage(i)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Paged moments carousel — GIFs served from public/moments/;
// missing files fall back to a placeholder tile instead of breaking the build.
import { ref, reactive } from 'vue'

const moments = [
  '/moments/Page_1.gif',
  '/moments/Page_2.gif',
  '/moments/Page_3.gif',
  '/moments/Page_4.gif',
  '/moments/Page_6.gif',
]

const pageIndex = ref(0)
const brokenSlots = reactive<Record<number, boolean>>({})

const goToPage = (i: number) => {
  pageIndex.value = i
}
const prevPage = () => {
  pageIndex.value = (pageIndex.value - 1 + moments.length) % moments.length
}
const nextPage = () => {
  pageIndex.value = (pageIndex.value + 1) % moments.length
}
const onImageError = (i: number) => {
  brokenSlots[i] = true
}
</script>

<style scoped>
.m-panel {
  background: rgba(17, 20, 32, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: clamp(24px, 4vw, 44px) clamp(16px, 4vw, 32px);
  text-align: center;
}

.m-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-weight: 400;
  font-size: clamp(1.05rem, 2.4vw, 1.5rem);
  letter-spacing: 0.04em;
  color: #ffffff;
  margin-bottom: clamp(20px, 3.5vw, 32px);
}

.m-stage {
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.m-page {
  position: relative;
  flex: 1 1 auto;
  aspect-ratio: 4 / 5;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.03);
}

.m-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.m-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
}

.m-placeholder-icon {
  color: inherit;
}

.m-nav {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.m-nav:hover {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

.m-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}

.m-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  transition: background-color 0.2s ease;
}

.m-dot-active {
  background-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}
</style>
