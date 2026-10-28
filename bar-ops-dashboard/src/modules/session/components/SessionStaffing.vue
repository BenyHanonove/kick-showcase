<template>
  <v-card class="pa-2 rounded-lg" width="100%">
    <v-card-title class="text-h5 font-weight-bold pa-4 text-center">
      עדכון סד"ק אירוע
    </v-card-title>

    <v-form ref="formRef" v-model="isValid" @submit.prevent="submit">
      <v-card-text class="d-flex flex-column ga-2">
        <v-text-field
          v-model.number="form.barmanAmount"
          label="כמות ברמנים"
          type="number"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-glass-cocktail"
          :rules="[rules.minNumber(0, 'חייב להיות 0 ומעלה')]"
        />

        <v-text-field
          v-model.number="form.waitersAmount"
          label="כמות מלצרים"
          type="number"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-room-service"
          :rules="[rules.minNumber(0, 'חייב להיות 0 ומעלה')]"
        />

        <v-text-field
          v-model.number="form.barMangerAmount"
          label="כמות מנהלי בר"
          type="number"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-account-star"
          :rules="[rules.minNumber(0, 'חייב להיות 0 ומעלה')]"
        />

        <v-text-field
          v-model.number="form.waiterMangerAmount"
          label="כמות מנהלי מלצרים"
          type="number"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-account-supervisor"
          :rules="[rules.minNumber(0, 'חייב להיות 0 ומעלה')]"
        />

        <v-text-field
          v-model.number="form.Runners"
          label="כמות ראנרים"
          type="number"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-run"
          :rules="[rules.minNumber(0, 'חייב להיות 0 ומעלה')]"
        />
      </v-card-text>

      <v-divider class="mt-2" />

      <v-card-actions class="pa-4">
        <v-spacer />
        <AppButton
          color="primary"
          type="submit"
          variant="elevated"
          size="large"
          :loading="loading"
          :disabled="!isValid"
        >
          עדכן סד"ק
        </AppButton>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { rules } from '@shared/utils/rules.util'

import type { ISession, IUpdateSession } from '@session/types/ISession.types'

const props = defineProps<{
  session: ISession
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', form: IUpdateSession): void
}>()

const formRef = ref()
const isValid = ref(false)

const form = reactive<IUpdateSession>({
  id: props.session.id,
  timestamp: props.session.timestamp,
  barmanAmount: props.session.barmanAmount ?? 0,
  waitersAmount: props.session.waitersAmount ?? 0,
  barMangerAmount: props.session.barMangerAmount ?? 0,
  waiterMangerAmount: props.session.waiterMangerAmount ?? 0,
  Runners: props.session.Runners ?? 0,
})

const submit = async () => {
  const { valid } = await formRef.value.validate()
  if (valid) {
    emit('submit', {
      id: form.id,
      timestamp: form.timestamp,
      barmanAmount: form.barmanAmount,
      waitersAmount: form.waitersAmount,
      barMangerAmount: form.barMangerAmount,
      waiterMangerAmount: form.waiterMangerAmount,
      Runners: form.Runners,
    })
  }
}
</script>
