<template>
  <div class="cta-panel">
    <p class="cta-eyebrow" dir="ltr">READY TO ELEVATE YOUR EVENT?</p>
    <h2 class="cta-title">בואו נהפוך את הבר לשיחת הערב שלכם</h2>
    <span class="cta-rule" />

    <p class="cta-lead">
      בין אם מדובר בחתונה אינטימית של 100 איש או פסטיבל חברה של 2,500 אורחים — הניסיון, הציוד והתפעול המדויק של KICK מבטיחים חוויה בלתי נשכחת.
    </p>

    <div class="cta-actions">
      <RouterLink to="/reserve" class="cta-btn cta-btn--primary">
        <span>השאירו פרטים להצעת מחיר</span>
        <v-icon end size="18">mdi-arrow-left</v-icon>
      </RouterLink>

      <a
        href="https://wa.me/972532753040"
        target="_blank"
        rel="noopener noreferrer"
        class="cta-btn cta-btn--whatsapp"
      >
        <v-icon start size="18">mdi-whatsapp</v-icon>
        <span>וואטסאפ מהיר עם מנהל אירוע</span>
      </a>

      <RouterLink to="/self-register" class="cta-btn cta-btn--work">
        <v-icon start size="18">mdi-account-plus-outline</v-icon>
        <span>בוא לעבוד איתנו</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// Final CTA section
</script>

<style scoped>
.cta-panel {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cta-eyebrow {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: clamp(0.66rem, 1.2vw, 0.78rem);
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 8px;
}

.cta-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.6rem, 4vh, 2.7rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.cta-rule {
  display: block;
  width: 56px;
  height: 3px;
  background-color: #a85038;
  margin: clamp(12px, 2vh, 20px) auto clamp(16px, 2.5vh, 28px);
}

.cta-lead {
  max-width: 680px;
  font-size: clamp(0.88rem, 1.4vw, 1.02rem);
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.78);
  margin: 0 0 clamp(20px, 3vh, 36px);
}

.cta-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.84rem, 1.3vw, 0.95rem);
  font-weight: 700;
  padding: clamp(10px, 1.6vh, 14px) clamp(18px, 2.5vw, 28px);
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.cta-btn--primary {
  background-color: #a85038;
  border: 1px solid #e59074;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(168, 80, 56, 0.35);
}

.cta-btn--primary:hover {
  background-color: #c25e42;
  border-color: #ff9e85;
  box-shadow: 0 12px 28px rgba(168, 80, 56, 0.55);
  transform: translateY(-2px);
}

.cta-btn--whatsapp {
  background-color: #25d366;
  color: #ffffff;
  box-shadow: 0 6px 18px rgba(37, 211, 102, 0.3);
}

.cta-btn--whatsapp:hover {
  background-color: #1ebe5d;
  box-shadow: 0 10px 24px rgba(37, 211, 102, 0.4);
  transform: translateY(-2px);
}

.cta-btn--work {
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
}

.cta-btn--work:hover {
  background-color: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.45);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
  color: #ffffff;
}

@media (max-width: 600px) {
  .cta-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
