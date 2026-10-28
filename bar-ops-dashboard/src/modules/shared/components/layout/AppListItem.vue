<template>
  <v-list-item
    :class="listItemClasses"
    v-bind="vuetifyProps"
    @click="handleClick"
  >
    <!-- Pass through all slots dynamically -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VListItem } from 'vuetify/components';

interface AppListItemProps {
  title?: string;
  subtitle?: string;
  prependIcon?: string;
  appendIcon?: string;
  disabled?: boolean;
  active?: boolean;
  value?: unknown;
  color?: string;
  baseColor?: string;
}

const props = defineProps<AppListItemProps>();

const emit = defineEmits<{
  click: [event: MouseEvent | KeyboardEvent];
}>();

const vuetifyProps = computed(() => {
  const result: Record<string, unknown> = {};

  if (props.title !== undefined) result.title = props.title;
  if (props.subtitle !== undefined) result.subtitle = props.subtitle;
  if (props.prependIcon !== undefined) result.prependIcon = props.prependIcon;
  if (props.appendIcon !== undefined) result.appendIcon = props.appendIcon;
  if (props.disabled !== undefined) result.disabled = props.disabled;
  if (props.active !== undefined) result.active = props.active;
  if (props.value !== undefined) result.value = props.value;
  if (props.color !== undefined) result.color = props.color;
  if (props.baseColor !== undefined) result.baseColor = props.baseColor;

  return result;
});

const listItemClasses = computed(() => {
  return {
    'app-list-item': true,
  };
});

const handleClick = (event: MouseEvent | KeyboardEvent) => {
  if (props.disabled) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  emit('click', event);
};
</script>

<style scoped>
.app-list-item {
  font-family: var(--bo-font-sans) !important;
  border-radius: var(--bo-radius-md) !important;
  transition: all var(--bo-transition-normal) !important;
}
</style>
