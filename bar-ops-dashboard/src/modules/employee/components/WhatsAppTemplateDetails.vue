<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-subtitle-1 font-weight-bold">תצוגה מקדימה</div>
      <v-switch
        v-model="showRaw"
        color="primary"
        density="compact"
        hide-details
        label="הצג משתנים"
      />
    </div>

    <WhatsAppTemplatePreview :template="template" :values="values" :raw="showRaw" />

    <div class="text-caption text-medium-emphasis mt-2">מתי נשלחת: {{ template.trigger }}</div>

    <v-divider class="my-5" />

    <div class="text-subtitle-1 font-weight-bold mb-3">משתני התבנית</div>
    <div class="d-flex flex-column ga-2">
      <div v-for="param in template.params" :key="param.index" class="d-flex align-center ga-3">
        <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">
          {{ paramToken(param.index) }}
        </v-chip>
        <div>
          <div class="text-body-2 font-weight-medium">{{ param.label }}</div>
          <div class="text-caption text-medium-emphasis">לדוגמה: {{ param.sample }}</div>
        </div>
      </div>

      <div v-if="template.button" class="d-flex align-center ga-3">
        <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">כפתור</v-chip>
        <div>
          <div class="text-body-2 font-weight-medium">{{ template.button.label }}</div>
          <div class="text-caption text-medium-emphasis">{{ template.button.note }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Preview + variable legend for one approved template, shared by every page that shows templates
import { ref } from 'vue'
import WhatsAppTemplatePreview from '@employee/components/WhatsAppTemplatePreview.vue'
import type { IWhatsAppTemplateDefinition } from '@employee/types/WhatsAppTemplate.types'

defineProps<{
  template: IWhatsAppTemplateDefinition
  // Real values keyed by placeholder index, where the page already knows them
  values?: Record<number, string>
}>()

const showRaw = ref(false)

// Built in script so the literal braces never reach the template compiler
const paramToken = (index: number) => `{{${index}}}`
</script>
