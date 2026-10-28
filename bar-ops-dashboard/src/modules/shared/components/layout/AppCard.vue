<template>
  <div :class="['app-card', variantClass, interactiveClass]">
    <div v-if="title" class="app-card__header">
      <VIcon v-if="icon" :icon="icon" class="app-card__icon" />
      <h3 class="app-card__title">{{ title }}</h3>
    </div>

    <slot name="divider" />

    <div class="app-card__content">
      <slot />
    </div>

    <div v-if="$slots.actions" class="app-card__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VIcon } from 'vuetify/components';

type CardVariant = 'summary' | 'form' | 'data' | 'minimal';

interface AppCardProps {
  variant?: CardVariant;
  title?: string;
  icon?: string;
  interactive?: boolean;
}

const props = withDefaults(defineProps<AppCardProps>(), {
  variant: 'summary',
  interactive: false,
});

const variantClass = computed(() => `app-card--${props.variant}`);

const interactiveClass = computed(() =>
  props.interactive ? 'app-card--interactive' : ''
);
</script>

<style scoped>
.app-card {
  width: 100%;
  border-radius: var(--bo-radius-md, 14px);
  background-color: var(--bo-color-surface);
  color: var(--bo-color-text-primary);
  overflow: hidden;
  transition: box-shadow var(--bo-transition-normal, 250ms ease-in-out);
}

/* ============ VARIANT STYLES ============ */

/* Summary: spacious padding, xl radius, raised shadow */
.app-card--summary {
  padding: var(--bo-card-padding-spacious, 24px);
  border-radius: var(--bo-radius-xl, 28px);
  box-shadow: var(--bo-shadow-raised, 0 2px 6px rgba(15, 23, 42, 0.06), 0 12px 28px rgba(15, 23, 42, 0.10));
}

/* Form: normal padding, lg radius, card shadow, divider support */
.app-card--form {
  padding: var(--bo-card-padding-normal, 16px);
  border-radius: var(--bo-radius-lg, 20px);
  box-shadow: var(--bo-shadow-card, 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06));
}

/* Data: compact padding, md radius, subtle shadow */
.app-card--data {
  padding: var(--bo-card-padding-compact, 12px);
  border-radius: var(--bo-radius-md, 14px);
  box-shadow: var(--bo-shadow-card, 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06));
}

/* Minimal: normal padding, flat (no shadow), 1px border */
.app-card--minimal {
  padding: var(--bo-card-padding-normal, 16px);
  border-radius: var(--bo-radius-md, 14px);
  border: 1px solid var(--bo-color-border);
  box-shadow: none;
}

/* ============ HEADER STYLES ============ */

.app-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.app-card__icon {
  font-size: 24px;
  color: var(--bo-color-primary);
}

.app-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--bo-color-text-primary);
}

/* ============ CONTENT STYLES ============ */

.app-card__content {
  width: 100%;
}

/* ============ ACTIONS STYLES ============ */

.app-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--bo-color-border);
}

/* ============ INTERACTIVE STYLES ============ */

.app-card--interactive {
  cursor: pointer;
}

.app-card--interactive:hover {
  box-shadow: var(--bo-shadow-hover, 0 4px 8px rgba(15, 23, 42, 0.08));
  transition: box-shadow var(--bo-transition-fast, 150ms ease);
}

/* ============ RESPONSIVE STYLES ============ */

@media (max-width: 599px) {
  .app-card {
    width: 100%;
    border-radius: var(--bo-radius-sm, 10px);
  }

  .app-card__header {
    flex-direction: row;
  }
}

@media (min-width: 600px) and (max-width: 899px) {
  .app-card {
    max-width: 80vw;
    margin: 0 auto;
  }
}

@media (min-width: 900px) {
  .app-card {
    max-width: 640px;
    margin: 0 auto;
  }
}

</style>
