<template>
  <v-expansion-panels variant="accordion" class="border rounded-lg overflow-hidden">
    <v-expansion-panel>
      <v-expansion-panel-title class="py-2">
        <div class="d-flex align-center ga-2 w-100">
          <v-icon size="18" icon="mdi-cash-plus" color="primary" />
          <span class="text-body-2 font-weight-bold">תוספות ובונוסים</span>
          <v-spacer />
          <v-chip
            v-if="total > 0"
            size="x-small"
            color="primary"
            variant="tonal"
            class="font-weight-bold me-2"
          >
            <span dir="ltr">₪{{ total }}</span>
          </v-chip>
        </div>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <v-row dense>
          <v-col v-for="bonus in bonusDefs" :key="bonus.key" cols="4">
            <AppInput
              type="number"
              :model-value="(form[bonus.key] as number)"
              @update:model-value="(v) => setBonus(bonus.key, v)"
              :label="bonus.label"
              prefix="₪"
              size="compact"
            />
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import AppInput from '@shared/components/input/AppInput.vue'
import type { FormValue } from '@shared/types/IForm.types'

// Binds to GenericForm's form object so values stay in the payload
const props = defineProps<{ form: Record<string, FormValue> }>()

// bonusTravel not editable here; keeps its initial form value
const bonusDefs = [
  { key: 'bonusManage', label: 'ניהול' },
  { key: 'bonusSetup', label: 'הקמה' },
  { key: 'bonusOther', label: 'אחר' },
] as const

const setBonus = (key: string, value: unknown) => {
  const parsed = Number(value)
  // form is GenericForm's shared mutable payload object, not a one-way-bound prop
  // eslint-disable-next-line vue/no-mutating-props
  props.form[key] = Number.isFinite(parsed) ? parsed : 0
}

const total = computed(() =>
  bonusDefs.reduce((sum, bonus) => sum + (Number(props.form[bonus.key]) || 0), 0),
)
</script>
