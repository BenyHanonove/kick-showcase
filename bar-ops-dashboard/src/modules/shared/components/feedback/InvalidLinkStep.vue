<template>
  <div class="sr-invalid" dir="rtl">
    <div class="sr-invalid__mark">
      <v-icon size="26" color="#f87171">mdi-link-variant-off</v-icon>
    </div>

    <p class="sr-invalid__text">{{ message }}</p>

    <p v-if="note" class="sr-invalid__note">{{ note }}</p>
  </div>
</template>

<script setup lang="ts">
// Public link pages: shown for a missing, expired, spent or revoked token - never says which
import { INVALID_LINK_MESSAGE } from '@shared/utils/publicLink.util'

withDefaults(defineProps<{ message?: string; note?: string }>(), {
  message: INVALID_LINK_MESSAGE,
  note: '',
})
</script>

<style scoped>
.sr-invalid {
  text-align: center;
  padding: 8px 0 4px;
}

.sr-invalid__mark {
  width: 52px;
  height: 52px;
  margin: 0 auto 20px;
  background: rgba(248, 113, 113, 0.15);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sr-invalid__text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #ffffff;
  margin: 0 auto 10px;
}

.sr-invalid__note {
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
  max-width: 320px;
  margin: 0 auto;
}
</style>
