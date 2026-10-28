<template>
  <div class="sr-success" dir="rtl">
    <div class="sr-success__check">
      <v-icon size="26" color="#f4f2ed">mdi-check</v-icon>
    </div>

    <p class="sr-success__text">
      {{ title }}
    </p>

    <ShiftRegisterEventCard :session="session" class="sr-success__event" />

    <p class="sr-success__note">
      נרשמת בתפקיד <strong>{{ ShiftRoleSelfLabels[role] }}</strong
      >. מנהל המשמרת יאשר את השיבוץ ויעדכן אותך בוואטסאפ
    </p>
  </div>
</template>

<script setup lang="ts">
// Step 2: confirmation, also used when the token belongs to an already registered employee
import { computed } from 'vue'
import ShiftRegisterEventCard from '@shift/components/ShiftRegisterEventCard.vue'
import { ShiftRoleSelfLabels } from '@shift/types/IShiftRegistration.types'
import type { IResolvedShiftRegistration } from '@shift/types/IShiftRegistration.types'
import type { ShiftRole } from '@shift/types/ShiftRole.types'

const props = withDefaults(
  defineProps<{
    firstName: string
    role: ShiftRole
    session: IResolvedShiftRegistration['session']
    alreadyRegistered?: boolean
  }>(),
  { alreadyRegistered: false },
)

const title = computed(() =>
  props.alreadyRegistered
    ? `${props.firstName}, כבר נרשמת למשמרת הזו`
    : `תודה ${props.firstName}, ההרשמה שלך נקלטה`,
)
</script>

<style scoped>
.sr-success {
  text-align: center;
  padding: 8px 0 4px;
}

.sr-success__check {
  width: 52px;
  height: 52px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: sr-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.sr-success__text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #ffffff;
  max-width: 340px;
  margin: 0 auto 20px;
  animation: sr-fade-in 0.6s ease 0.2s both;
}

.sr-success__event {
  animation: sr-fade-in 0.6s ease 0.3s both;
}

.sr-success__note {
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
  margin: 16px 0 0;
  animation: sr-fade-in 0.6s ease 0.4s both;
}

@keyframes sr-pop {
  0% {
    opacity: 0;
    transform: scale(0.4);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes sr-fade-in {
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
