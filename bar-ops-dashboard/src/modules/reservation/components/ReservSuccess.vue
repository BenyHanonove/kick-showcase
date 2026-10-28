<template>
  <div class="rk-panel">
    <div class="rk-mark">
      <img :src="kickLogo" alt="KICK" class="rk-logo" />
    </div>

    <h2 class="rk-title">{{ firstName ? `תודה, ${firstName}` : 'תודה' }}</h2>
    <span class="rk-rule" />
    <p class="rk-body">
      קיבלנו את הפרטים. אנחנו מרימים אליכם טלפון ממש בקרוב, נשמע על האירוע ונחזור אליכם
      עם הצעה מותאמת.
    </p>
  </div>
</template>

<script setup lang="ts">
// Confirmation state for the reservation brief form
import kickLogo from '@assets/register/kick-white.png'

defineProps<{ firstName: string }>()
</script>

<style scoped>
.rk-panel {
  text-align: center;
}

/* Logo drops in once, then keeps a slow float so the panel doesn't sit dead */
.rk-mark {
  margin: 0 auto clamp(20px, 3vw, 30px);
  animation:
    rk-drop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both,
    rk-float 3.2s ease-in-out 0.7s infinite;
}

.rk-logo {
  width: clamp(120px, 16vw, 180px);
  display: block;
  margin: 0 auto;
}

.rk-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 800;
  font-size: clamp(1.6rem, 4vw, 2.6rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.rk-rule {
  display: block;
  width: 56px;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 2px;
  margin: clamp(18px, 3vw, 26px) auto;
}

.rk-body {
  max-width: 44ch;
  margin: 0 auto;
  font-size: clamp(0.9rem, 1.6vw, 1rem);
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.75);
}

@keyframes rk-drop {
  from {
    opacity: 0;
    transform: translateY(-28px) scale(0.86);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes rk-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-9px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rk-mark {
    animation: none;
  }
}
</style>
