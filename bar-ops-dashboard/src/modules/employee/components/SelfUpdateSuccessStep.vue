<template>
  <div class="su-success" dir="rtl">
    <div class="su-success__check">
      <v-icon size="26" color="#f4f2ed">mdi-check</v-icon>
    </div>

    <p class="su-success__text">
      תודה {{ firstName }}, הפרטים שלך עודכנו בהצלחה במערכת.
    </p>
  </div>
</template>

<script setup lang="ts">
// Step 3: success message, personalized with the (mock) employee's first name
defineProps<{
  firstName: string
}>()
</script>

<style scoped>
.su-success {
  text-align: center;
  padding: 24px 8px;
}

.su-success__check {
  width: 52px;
  height: 52px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: su-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.su-success__text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #ffffff;
  max-width: 340px;
  margin: 0 auto;
  animation: su-fade-in 0.6s ease 0.2s both;
}

@keyframes su-pop {
  0% {
    opacity: 0;
    transform: scale(0.4);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes su-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
