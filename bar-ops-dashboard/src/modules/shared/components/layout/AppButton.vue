<template>
  <v-btn
    :class="buttonClasses"
    v-bind="vuetifyProps"
    @click="handleClick"
  >
    <!-- Prepend Icon (for buttons with text) -->
    <template v-if="resolvedPrependIcon && !isIconOnly" #prepend>
      <v-icon :icon="resolvedPrependIcon" :class="iconClasses" />
    </template>

    <!-- Icon-only icon -->
    <v-icon v-if="isIconOnly && typeof props.icon === 'string'" :icon="props.icon" :class="iconClasses" />

    <!-- Standard Slot content -->
    <slot v-else />

    <!-- Append Icon (for buttons with text) -->
    <template v-if="resolvedAppendIcon && !isIconOnly" #append>
      <v-icon :icon="resolvedAppendIcon" :class="iconClasses" />
    </template>
  </v-btn>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { VBtn, VIcon } from 'vuetify/components';

interface AppButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | string;
  size?: 'small' | 'normal' | 'large' | string | number;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  icon?: string | boolean;
  prependIcon?: string;
  appendIcon?: string;
  ariaLabel?: string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  iconPosition?: 'left' | 'right';
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  variant: 'primary',
  size: 'normal',
  loading: false,
  disabled: false,
  block: false,
  type: 'button',
  iconPosition: 'left',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const slots = useSlots();

const isIconOnly = computed(() => {
  if (props.icon === true) return true;
  return (!!props.prependIcon || (!!props.icon && typeof props.icon === 'string')) && !slots.default;
});

const resolvedPrependIcon = computed(() => {
  if (props.prependIcon) return props.prependIcon;
  if (props.icon && typeof props.icon === 'string' && props.iconPosition === 'left') return props.icon;
  return null;
});

const resolvedAppendIcon = computed(() => {
  if (props.appendIcon) return props.appendIcon;
  if (props.icon && typeof props.icon === 'string' && props.iconPosition === 'right') return props.icon;
  return null;
});

const iconClasses = computed(() => {
  return {
    'app-button__icon': true,
    'app-button__icon--left': props.iconPosition === 'left',
    'app-button__icon--right': props.iconPosition === 'right',
  };
});

const vuetifyProps = computed(() => {
  const result: Record<string, unknown> = {
    loading: props.loading,
    disabled: props.disabled,
    block: props.block,
    type: props.type,
  };

  // Resolve accessible aria-label
  const aria = props.ariaLabel || props.title || (isIconOnly.value && typeof props.icon === 'string'
    ? props.icon.replace('mdi-', '').replace(/-/g, ' ')
    : undefined);

  if (aria) {
    result['aria-label'] = aria;
  }
  if (props.title) {
    result.title = props.title;
  }

  // Map custom variants to Vuetify defaults
  if (props.variant) {
    if (props.variant === 'primary') {
      result.variant = 'elevated';
      result.color = 'primary';
    } else if (props.variant === 'secondary') {
      result.variant = 'outlined';
      result.color = 'primary';
    } else if (props.variant === 'tertiary') {
      result.variant = 'text';
      result.color = 'primary';
    } else if (props.variant === 'danger') {
      result.variant = 'elevated';
      result.color = 'error';
    } else {
      result.variant = props.variant;
    }
  }

  // Map custom sizes to Vuetify sizes
  if (props.size) {
    if (props.size === 'normal') {
      result.size = 'default';
    } else {
      result.size = props.size;
    }
  }

  // Map icon-only button behavior to Vuetify icon attribute
  if (isIconOnly.value) {
    result.icon = true;
  }

  return result;
});

const buttonClasses = computed(() => {
  const classes: Record<string, boolean> = {
    'app-button': true,
    'app-button--loading': props.loading,
    'app-button--disabled': props.disabled,
    'app-button--block': props.block,
  };
  if (props.variant && ['primary', 'secondary', 'tertiary', 'danger'].includes(props.variant)) {
    classes[`app-button--${props.variant}`] = true;
  }
  if (props.size && ['small', 'normal', 'large'].includes(props.size as string)) {
    classes[`app-button--${props.size}`] = true;
  }
  return classes;
});

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  emit('click', event);
};
</script>

<style scoped>
.app-button {
  font-family: var(--bo-font-sans) !important;
  font-weight: 500 !important;
  border-radius: var(--bo-radius-lg) !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  transition: all var(--bo-transition-normal) !important;
}

/* Custom elevations and styles for our premium variants */
.app-button--primary {
  box-shadow: var(--bo-shadow-raised) !important;
}
.app-button--primary:hover:not(:disabled) {
  box-shadow: var(--bo-shadow-hover) !important;
}
.app-button--primary:active:not(:disabled) {
  transform: scale(0.98);
}

.app-button--secondary {
  border-width: 2px !important;
}
.app-button--secondary:active:not(:disabled) {
  transform: scale(0.98);
}

.app-button--tertiary:active:not(:disabled) {
  transform: scale(0.98);
}

.app-button--danger {
  box-shadow: var(--bo-shadow-raised) !important;
}
.app-button--danger:hover:not(:disabled) {
  box-shadow: var(--bo-shadow-hover) !important;
}
.app-button--danger:active:not(:disabled) {
  transform: scale(0.98);
}
</style>
