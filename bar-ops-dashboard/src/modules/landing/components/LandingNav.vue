<template>
  <header class="lp-nav" :class="{ 'lp-nav--scrolled': isScrolled }">
    <div class="lp-nav-inner">
      <!-- Brand Logo -->
      <RouterLink to="/" class="lp-nav-brand" @click="handleBrandClick">
        <img :src="kickLogo" alt="KICK" class="lp-nav-logo" />
      </RouterLink>

      <!-- Desktop Section Links -->
      <nav class="lp-nav-links" aria-label="ניווט מערכת KICK">
        <RouterLink
          to="/"
          class="lp-nav-link"
          :class="{ 'lp-nav-link--active': route.path === '/' }"
        >
          ראשי
        </RouterLink>

        <a href="#about" class="lp-nav-link" @click.prevent="handleSectionClick('about')">
          מי אנחנו
        </a>
        <a href="#services" class="lp-nav-link" @click.prevent="handleSectionClick('services')">
          שירותים
        </a>
        <RouterLink
          to="/reserve"
          class="lp-nav-link"
          :class="{ 'lp-nav-link--active': route.path === '/reserve' }"
        >
          הזמנת אירוע
        </RouterLink>
        <RouterLink
          to="/self-register"
          class="lp-nav-link"
          :class="{ 'lp-nav-link--active': route.path === '/self-register' }"
        >
          דרושים לבר
        </RouterLink>

      </nav>

      <!-- Action Buttons -->
      <div class="lp-nav-actions">
        <!-- Interactive Login / Dashboard Button -->
        <RouterLink
          to="/dashboard"
          class="lp-nav-btn lp-nav-btn--ghost"
        >
          <v-icon size="16" class="me-1">
            {{ isAuthenticated ? 'mdi-view-dashboard' : 'mdi-lock-outline' }}
          </v-icon>
          <span class="lp-nav-btn-text">
            {{ isAuthenticated ? 'לדשבורד' : 'כניסה למערכת' }}
          </span>
        </RouterLink>

        <!-- Primary CTA to Reserve -->
        <RouterLink to="/reserve" class="lp-nav-btn lp-nav-btn--primary">
          <v-icon size="16" class="me-1">mdi-glass-cocktail</v-icon>
          <span>הזמנת אירוע</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AuthStore } from '@stores'
import kickLogo from '@assets/register/kick-white.png'

const route = useRoute()
const router = useRouter()
const authStore = AuthStore()
const isAuthenticated = computed(() => !!authStore.user)

const isScrolled = ref(false)

const handleBrandClick = () => {
  if (route.path === '/') {
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleSectionClick = (id: string) => {
  if (route.path === '/') {
    emit('navigate', id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    router.push({ path: '/', hash: `#${id}` })
  }
}

const emit = defineEmits<{
  (e: 'navigate', id: string): void
}>()

const handleScroll = () => {
  isScrolled.value = window.scrollY > 30
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.lp-nav {
  position: fixed;
  top: 14px;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 clamp(16px, 4vw, 36px);
  pointer-events: none;
  transition: all 0.3s ease;
}

.lp-nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 18px;
  background: rgba(13, 15, 24, 0.82);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.lp-nav-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.lp-nav-brand:hover {
  opacity: 0.9;
  transform: scale(1.03);
}

.lp-nav-logo {
  height: clamp(36px, 5.2vh, 48px);
  width: auto;
  display: block;
}

.lp-nav-links {
  display: flex;
  align-items: center;
  gap: clamp(10px, 2vw, 24px);
}

.lp-nav-link {
  font-size: clamp(0.8rem, 1.1vw, 0.88rem);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.lp-nav-link:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.08);
}

.lp-nav-link--active {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

.lp-nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lp-nav-btn {
  display: inline-flex;
  align-items: center;
  font-size: clamp(0.75rem, 1.1vw, 0.84rem);
  font-weight: 700;
  padding: 7px 16px;
  border-radius: 999px;
  text-decoration: none;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.lp-nav-btn--ghost {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.lp-nav-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
}

.lp-nav-btn--primary {
  color: #ffffff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}

.lp-nav-btn--primary:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  border-color: #34d399;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.5);
}

@media (max-width: 860px) {
  .lp-nav-links {
    display: none;
  }
}

@media (max-width: 540px) {
  .lp-nav {
    top: 8px;
    padding: 0 10px;
  }

  .lp-nav-inner {
    padding: 6px 12px;
  }

  .lp-nav-logo {
    height: 32px;
  }

  .lp-nav-btn-text {
    display: none;
  }

  .lp-nav-btn {
    padding: 6px 10px;
  }
}
</style>
