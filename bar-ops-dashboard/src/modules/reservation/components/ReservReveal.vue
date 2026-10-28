<template>
  <div
    ref="root"
    class="rv"
    :class="{ 'rv-in': isVisible }"
    :style="{ '--rv-delay': `${delay}ms` }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
// Reveals its slot once the block first scrolls into view
import { ref, onMounted, onBeforeUnmount } from 'vue'

withDefaults(defineProps<{ delay?: number }>(), { delay: 0 })

const root = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced || !('IntersectionObserver' in window) || !root.value) {
    isVisible.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting) return
      isVisible.value = true
      observer?.disconnect()
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  )

  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.rv {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) var(--rv-delay),
    transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) var(--rv-delay);
}

.rv-in {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .rv {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
