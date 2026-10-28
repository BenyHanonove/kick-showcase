<template>
  <div :class="['app-input', `app-input--${size}`, $attrs.class]" :style="($attrs.style as import('vue').StyleValue)">
    <VTextField
      v-if="type === 'text' || type === 'email' || type === 'number' || type === 'password' || type === 'date' || type === 'datetime-local' || type === 'tel' || type === 'url' || type === 'month'"
      :model-value="modelValue"
      :type="type"
      :variant="variant"
      :density="densityMap[size]"
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :error="error"
      :hint="hint"
      :rules="rules"
      v-bind="{ ...typeSpecificProps, ...$attrs, class: undefined, style: undefined }"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <VSelect
      v-else-if="type === 'select'"
      :model-value="modelValue"
      :items="items"
      :variant="variant"
      :density="densityMap[size]"
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :error="error"
      :hint="hint"
      :multiple="multiple"
      :rules="rules"
      v-bind="{ ...typeSpecificProps, ...$attrs, class: undefined, style: undefined }"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <VCheckbox
      v-else-if="type === 'checkbox'"
      :model-value="modelValue"
      :label="label"
      :disabled="disabled"
      :error="error"
      :rules="rules"
      v-bind="{ ...typeSpecificProps, ...$attrs, class: undefined, style: undefined }"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <VSwitch
      v-else-if="type === 'switch'"
      :model-value="modelValue"
      :label="label"
      :disabled="disabled"
      :error="error"
      :rules="rules"
      v-bind="{ ...typeSpecificProps, ...$attrs, class: undefined, style: undefined }"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- VTextarea renders label and placeholder overlapping; label wins -->
    <VTextarea
      v-else-if="type === 'textarea'"
      :model-value="modelValue"
      :variant="variant"
      :density="densityMap[size]"
      :label="label"
      :placeholder="label ? undefined : placeholder"
      :disabled="disabled"
      :error="error"
      :hint="hint"
      :rules="rules"
      v-bind="{ ...typeSpecificProps, ...$attrs, class: undefined, style: undefined }"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <VFileInput
      v-else-if="type === 'file'"
      :model-value="(modelValue as File | File[] | null | undefined)"
      :variant="variant"
      :density="densityMap[size]"
      :label="label"
      :disabled="disabled"
      :error="error"
      :hint="hint"
      :rules="rules"
      v-bind="{ ...typeSpecificProps, ...$attrs, class: undefined, style: undefined }"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <VAutocomplete
      v-else-if="type === 'autocomplete'"
      :model-value="modelValue"
      :items="items"
      :item-title="itemTitle"
      :item-value="itemValue"
      :variant="variant"
      :density="densityMap[size]"
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :error="error"
      :hint="hint"
      :multiple="multiple"
      :rules="rules"
      v-bind="{ ...typeSpecificProps, ...$attrs, class: undefined, style: undefined }"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  VTextField,
  VSelect,
  VCheckbox,
  VSwitch,
  VTextarea,
  VFileInput,
  VAutocomplete,
} from 'vuetify/components';
import type { AppInputProps, ModelValueType } from '../../types/IInput.types';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<AppInputProps>(), {
  variant: 'outlined',
  size: 'normal',
  disabled: false,
  error: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: ModelValueType];
}>();

const densityMap = {
  compact: 'compact' as const,
  normal: 'comfortable' as const,
  spacious: 'comfortable' as const,
};

const typeSpecificProps = computed(() => {
  const base: Record<string, unknown> = {
    rounded: 'lg',
  };

  if (props.type === 'select' || props.type === 'autocomplete') {
    base.clearable = true;
  }

  if (props.type === 'textarea') {
    base.rows = props.rows ?? 4;
  }

  return base;
});
</script>

<style scoped>
.app-input {
  width: 100%;
}

.app-input--compact {
  /* Compact size styling if needed */
}

.app-input--normal {
  /* Normal size styling if needed */
}

.app-input--spacious :deep(.v-field__input) {
  padding: var(--bo-card-padding-spacious, 24px);
}
</style>
