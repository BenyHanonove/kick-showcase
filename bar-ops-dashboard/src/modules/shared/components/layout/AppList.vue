<template>
  <v-list class="app-list" :density="density">
    <template v-for="(group, groupIndex) in visibleGroups" :key="groupIndex">
      <!-- Divider separates each action group -->
      <v-divider v-if="groupIndex > 0" class="my-1" />
      <AppListItem
        v-for="action in group"
        :key="action.title"
        :title="action.title"
        :prepend-icon="action.loading ? undefined : action.icon"
        :base-color="action.color"
        :disabled="action.disabled"
        @click.stop="action.handler()"
      >
        <!-- Spinner replaces the icon while the action is running -->
        <template v-if="action.loading" #prepend>
          <v-progress-circular indeterminate size="16" width="2" color="primary" class="me-2" />
        </template>
      </AppListItem>
    </template>
  </v-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VList, VDivider, VProgressCircular } from 'vuetify/components';
import AppListItem from './AppListItem.vue';
import type { IListAction } from '@shared/types/IListAction.types';

interface AppListProps {
  actions: IListAction[][];
  density?: 'default' | 'comfortable' | 'compact';
}

const props = withDefaults(defineProps<AppListProps>(), {
  density: 'compact',
});

// Skip empty groups so dividers never double up
const visibleGroups = computed(() => props.actions.filter((group) => group.length > 0));
</script>

<style scoped>
.app-list {
  font-family: var(--bo-font-sans) !important;
  border-radius: var(--bo-radius-md) !important;
}
</style>
