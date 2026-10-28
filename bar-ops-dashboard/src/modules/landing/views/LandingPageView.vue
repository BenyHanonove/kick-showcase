<template>
  <VThemeProvider theme="dark">
    <div class="lp-page" dir="rtl">
      <!-- Background Ambient Glows -->
      <div class="lp-glow lp-glow-top" aria-hidden="true" />
      <div class="lp-glow lp-glow-middle" aria-hidden="true" />
      <div class="lp-glow lp-glow-bottom" aria-hidden="true" />

      <!-- Floating Glass Navigation Bar -->
      <LandingNav @navigate="scrollTo" />

      <main class="lp-main" id="main-content" tabindex="-1">
        <!-- Section 1: Hero -->
        <section id="hero" class="lp-section lp-section--hero">
          <div class="lp-container">
            <LandingHero @explore="scrollTo('services')" />
          </div>
        </section>

        <!-- Section 2: About KICK -->
        <section id="about" class="lp-section">
          <div class="lp-container">
            <ReservReveal>
              <LandingAbout />
            </ReservReveal>
          </div>
        </section>

        <!-- Section 3: Comprehensive Services Bento Grid -->
        <section id="services" class="lp-section">
          <div class="lp-container">
            <ReservReveal>
              <LandingServices />
            </ReservReveal>
          </div>
        </section>

        <!-- Section 4: Track Record & Numbers -->
        <section id="stats" class="lp-section">
          <div class="lp-container">
            <ReservReveal>
              <LandingStats />
            </ReservReveal>
          </div>
        </section>

        <!-- Section 5: Event Process -->
        <section id="process" class="lp-section">
          <div class="lp-container">
            <ReservReveal>
              <LandingProcess />
            </ReservReveal>
          </div>
        </section>

        <!-- Section 6: SEO-rich FAQ -->
        <section id="faq" class="lp-section">
          <div class="lp-container">
            <ReservReveal>
              <LandingFaq />
            </ReservReveal>
          </div>
        </section>

        <!-- Section 7: Final CTA & Booking Inquiry -->
        <section id="cta" class="lp-section lp-section--cta">
          <div class="lp-container">
            <ReservReveal>
              <LandingCta />
            </ReservReveal>
          </div>
        </section>
      </main>

      <!-- Upgraded App Footer -->
      <AppFooter class="lp-footer" />
    </div>
  </VThemeProvider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { VThemeProvider } from 'vuetify/components'
import ReservReveal from '@reservation/components/ReservReveal.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'

import LandingNav from '../components/LandingNav.vue'
import LandingHero from '../components/LandingHero.vue'
import LandingAbout from '../components/LandingAbout.vue'
import LandingServices from '../components/LandingServices.vue'
import LandingStats from '../components/LandingStats.vue'
import LandingProcess from '../components/LandingProcess.vue'
import LandingFaq from '../components/LandingFaq.vue'
import LandingCta from '../components/LandingCta.vue'

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Inject JSON-LD structured data for Google Rich Results
onMounted(() => {
  const schemaId = 'kick-event-bars-jsonld'
  if (!document.getElementById(schemaId)) {
    const script = document.createElement('script')
    script.id = schemaId
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'LocalBusiness',
          '@id': 'https://kicks.ltd/#organization',
          name: 'KICK שירותי בר לאירועים והפקות',
          alternateName: ['KICK', 'KICK שירותי בר', 'KICK שירותי בר בע"מ'],
          url: 'https://kicks.ltd',
          logo: 'https://kicks.ltd/favicon.svg',
          image: 'https://kicks.ltd/og-image.png',
          description:
            'שירותי בר פרימיום, מיקסולוגיה, ברמנים מקצועיים וציוד מלא לחתונות, אירועי חברה והפקות ענק בכל הארץ.',
          telephone: '+972-53-275-3040',
          priceRange: '₪₪₪',
          areaServed: {
            '@type': 'Country',
            name: 'Israel',
          },
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'IL',
          },
        },
        {
          '@type': 'Service',
          serviceType: 'שירותי בר לאירועים והפקות',
          provider: {
            '@id': 'https://kicks.ltd/#organization',
          },
          areaServed: {
            '@type': 'Country',
            name: 'Israel',
          },
          description:
            'עמדות בר מעוצבות, קוקטיילים חתימה, ציוד מלא, קרח ולוגיסטיקה מדויקת מקצה לקצה.',
        },
      ],
    })
    document.head.appendChild(script)
  }
})
</script>

<style scoped>
/* Natural, continuous vertical scrolling without snapping or locks */
.lp-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background-color: #090a0f;
  color: #f1f5f9;
  scroll-behavior: smooth;
}

/* Ambient Radial Glows (Watermelon UI / Modern Dark SaaS) */
.lp-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 0;
}

.lp-glow-top {
  top: -150px;
  right: 15%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(168, 80, 56, 0.16) 0%, transparent 70%);
}

.lp-glow-middle {
  top: 35%;
  left: 5%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(74, 127, 158, 0.1) 0%, transparent 70%);
}

.lp-glow-bottom {
  bottom: 10%;
  right: 10%;
  width: 650px;
  height: 650px;
  background: radial-gradient(circle, rgba(168, 80, 56, 0.12) 0%, transparent 70%);
}

.lp-main {
  position: relative;
  z-index: 1;
}

/* Fluid, beautifully spaced sections */
.lp-section {
  padding: clamp(48px, 8vh, 96px) clamp(16px, 4vw, 32px);
}

.lp-section--hero {
  padding-top: clamp(100px, 15vh, 140px);
}

.lp-section--cta {
  padding-bottom: clamp(60px, 10vh, 120px);
}

/* Max-width container with auto margins */
.lp-container {
  max-width: 1140px;
  margin: 0 auto;
  width: 100%;
}

.lp-footer {
  position: relative;
  z-index: 1;
  margin-top: 0;
}
</style>
