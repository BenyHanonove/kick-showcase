<template>
  <div class="wa-preview" dir="rtl">
    <div class="wa-preview__bubble">
      <div class="wa-preview__header">{{ template.header }}</div>

      <p class="wa-preview__body">
        <template v-for="(segment, i) in segments" :key="i">
          <span v-if="segment.param" class="wa-preview__param" :title="segment.param.label">
            {{ segment.text }}
          </span>
          <span v-else>{{ segment.text }}</span>
        </template>
      </p>

      <div class="wa-preview__meta">
        <span class="wa-preview__footer">{{ template.footer }}</span>
        <span class="wa-preview__time">{{ time }}</span>
      </div>

      <div v-if="template.button" class="wa-preview__button">
        <v-icon size="16">{{ template.button.icon }}</v-icon>
        <span>{{ template.button.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Renders an approved WhatsApp template the way the employee receives it, with the {{n}} slots marked
import { computed } from 'vue'
import type {
  IWhatsAppTemplateDefinition,
  IWhatsAppTemplateParam,
} from '@employee/types/WhatsAppTemplate.types'

const props = withDefaults(
  defineProps<{
    template: IWhatsAppTemplateDefinition
    // Real values keyed by placeholder index, falls back to the template samples
    values?: Record<number, string>
    // Show the raw {{n}} tokens instead of any value
    raw?: boolean
    time?: string
  }>(),
  { values: undefined, raw: false, time: '12:30' },
)

interface ISegment {
  text: string
  param?: IWhatsAppTemplateParam
}

const paramByIndex = computed(
  () => new Map(props.template.params.map((param) => [param.index, param])),
)

// Value shown in place of {{n}}: caller value, then sample, then the raw token
const paramText = (param: IWhatsAppTemplateParam): string => {
  if (props.raw) return `{{${param.index}}}`
  return props.values?.[param.index] || param.sample
}

// Split the body on {{n}} so the placeholders can be highlighted separately
const segments = computed<ISegment[]>(() =>
  props.template.body
    .split(/(\{\{\d+\}\})/g)
    .filter((part) => part.length > 0)
    .map((part) => {
      const match = part.match(/^\{\{(\d+)\}\}$/)
      const param = match ? paramByIndex.value.get(Number(match[1])) : undefined

      return param ? { text: paramText(param), param } : { text: part }
    }),
)
</script>

<style scoped>
.wa-preview {
  background-color: #ded3c4;
  background-image: radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-size: 14px 14px;
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  justify-content: center;
}

.wa-preview__bubble {
  background-color: #ffffff;
  color: #111b21;
  border-radius: 10px;
  padding: 10px 12px 8px;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 1px 2px rgba(11, 20, 26, 0.2);
}

.wa-preview__header {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.wa-preview__body {
  font-size: 0.9rem;
  line-height: 1.55;
  white-space: pre-wrap;
  margin: 0;
}

.wa-preview__param {
  background-color: rgba(0, 168, 132, 0.14);
  border-bottom: 1px dashed #00a884;
  border-radius: 3px;
  padding: 0 3px;
  font-weight: 600;
}

.wa-preview__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}

.wa-preview__footer,
.wa-preview__time {
  font-size: 0.72rem;
  color: #667781;
}

.wa-preview__button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 8px -12px -8px;
  padding: 9px 12px;
  border-top: 1px solid #e9edef;
  color: #00a5f4;
  font-size: 0.88rem;
  font-weight: 500;
}
</style>
