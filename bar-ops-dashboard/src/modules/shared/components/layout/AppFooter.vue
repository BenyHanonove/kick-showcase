<template>
  <footer class="app-foot" dir="rtl">
    <!-- Subtle Watermelon UI Top Glow Border -->
    <div class="app-foot-glow" aria-hidden="true" />

    <div class="app-foot-inner">
      <!-- Row 1: Legal Links | Social Icons -->
      <div class="app-foot-row-main">
        <nav class="app-foot-links" aria-label="קישורים משפטיים">
          <RouterLink to="/terms" class="app-foot-link">תנאי שימוש</RouterLink>
          <RouterLink to="/privacy-policy" class="app-foot-link">מדיניות פרטיות</RouterLink>
          <RouterLink to="/accessibility" class="app-foot-link">הצהרת נגישות</RouterLink>
        </nav>

        <div class="app-foot-social">
          <a
            href="https://www.instagram.com/kick_morethanbar/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            class="app-foot-social-btn"
          >
            <v-icon size="17">mdi-instagram</v-icon>
          </a>
          <a
            :href="`https://wa.me/${env.contact.whatsappNumber}`"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            class="app-foot-social-btn"
          >
            <v-icon size="17">mdi-whatsapp</v-icon>
          </a>
        </div>
      </div>

      <!-- Row 2: Copyright -->
      <div class="app-foot-row-copy">
        <span dir="ltr" class="app-foot-copy">© {{ year }} KICK LTD. ALL RIGHTS RESERVED.</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { env } from '@plugins'

const year = new Date().getFullYear()
</script>

<style scoped>
.app-foot {
  position: relative;
  background-color: #090a0f;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding: 24px 20px 20px;
  margin-top: auto;
  overflow: hidden;
  z-index: 10;
}

.app-foot-glow {
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.35) 50%, transparent);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
  pointer-events: none;
}

.app-foot-inner {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.app-foot-row-main {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.app-foot-links {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.app-foot-link {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.74rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-decoration: none;
  padding: 5px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.app-foot-link:hover {
  color: #10b981;
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
}

.app-foot-link:focus-visible,
.app-foot-social-btn:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 3px;
  border-radius: 8px;
}

.app-foot-social {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-foot-social-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.22s ease;
}

.app-foot-social-btn:hover {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.35);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(16, 185, 129, 0.2);
}

.app-foot-row-copy {
  width: 100%;
  display: flex;
  justify-content: center;
}

.app-foot-copy {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  text-align: center;
}

@media (max-width: 680px) {
  .app-foot {
    padding: 18px 14px 14px;
  }
  .app-foot-inner {
    gap: 12px;
  }
  .app-foot-row-main {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .app-foot-links {
    gap: 4px 8px;
  }
  .app-foot-link {
    font-size: 0.68rem;
    padding: 4px 8px;
  }
  .app-foot-copy {
    font-size: 0.62rem;
  }
}
</style>

