<template>
  <v-container class="px-4 py-3">
    <!-- Without a search bar: actions drop below the text on phones, same row from tablet (sm) up.
         With a search bar: stacked until laptop (md), then two halves. -->
    <v-row
      :align="searchLabel ? 'end' : 'center'"
      :class="searchLabel ? 'ga-3 ga-md-0' : 'ga-3 ga-sm-0'"
    >
      <!-- Left half: breadcrumbs + title + description -->
      <v-col
        cols="12"
        :sm="searchLabel ? 12 : true"
        :md="searchLabel ? 6 : true"
        class="page-header__title-col"
      >
        <v-breadcrumbs
          v-if="path.length"
          :items="path"
          density="compact"
          aria-label="נתיב ניווט"
          class="page-header__crumbs pa-0 mb-1"
        >
          <!-- Use an icon divider instead of a text chevron: the "‹"/"›" quotation
               marks are bidi-mirrored, so in this RTL layout the browser flips the
               glyph and it ends up pointing back toward the parent crumb. An mdi
               chevron isn't mirrored, so it reliably points left (toward the current
               page) as the RTL trail progresses right-to-left. -->
          <template #divider>
            <v-icon icon="mdi-chevron-left" size="small" />
          </template>
        </v-breadcrumbs>
        <h1 class="page-header__title font-weight-bold">{{ title }}</h1>
        <p v-if="desc" class="text-body-2 text-medium-emphasis mb-0 mt-1">{{ desc }}</p>
      </v-col>

      <!-- Right half: search (3/4) + action button (1/4) — omitted when neither exists -->
      <v-col
        v-if="searchLabel || hasActions || $slots.actions"
        cols="12"
        :sm="searchLabel ? 12 : 'auto'"
        :md="searchLabel ? 6 : 'auto'"
        :class="{ 'd-flex justify-end': !searchLabel }"
      >
        <!-- Custom actions replace the built-in menu, on the same row as the title -->
        <slot name="actions" />
        <v-row v-if="!$slots.actions" no-gutters align="center" :justify="searchLabel ? undefined : 'end'">
          <v-col v-if="searchLabel" :cols="hasActions ? 9 : 12" :class="{ 'pe-3': hasActions }">
            <SearchBar v-model="query" :label="searchLabel" />
          </v-col>
          <v-col v-if="hasActions" :cols="searchLabel ? 3 : 'auto'" class="d-flex justify-end">
            <AuthWrapper :level="minRole">
              <!-- Single Action -->
              <AuthWrapper v-if="totalActionsCount === 1 && singleAction" :level="singleAction.minRole || minRole">
                <AppButton
                  class="page-header__cta"
                  :color="singleAction.color || 'primary'"
                  :prepend-icon="singleAction.icon || 'mdi-plus'"
                  :variant="singleAction.variant || 'elevated'"
                  rounded="lg"
                  size="large"
                  :block="!!searchLabel"
                  :disabled="singleAction.disabled"
                  @click="singleAction.action"
                >
                  {{ singleAction.label }}
                </AppButton>
              </AuthWrapper>

              <!-- Multiple Actions -->
              <v-menu v-else transition="slide-y-transition" rounded="lg">
                <template #activator="{ props: menuProps }">
                  <AppButton
                    v-bind="menuProps"
                    variant="tonal"
                    color="primary"
                    append-icon="mdi-chevron-down"
                    rounded="lg"
                    size="large"
                    :block="!!searchLabel"
                  >
                    פעולות
                  </AppButton>
                </template>
                <v-list class="py-1">
                  <template v-for="(group, groupIdx) in groupedActions" :key="groupIdx">
                    <v-divider v-if="groupIdx > 0" class="my-1" />
                    <AuthWrapper
                      v-for="(action, index) in group"
                      :key="index"
                      :level="action.minRole || minRole"
                    >
                      <v-list-item
                        :prepend-icon="action.icon"
                        :color="action.color"
                        :disabled="action.disabled"
                        @click="action.action"
                        class="font-weight-bold"
                      >
                        <v-list-item-title>{{ action.label }}</v-list-item-title>
                      </v-list-item>
                    </AuthWrapper>
                  </template>
                </v-list>
              </v-menu>
            </AuthWrapper>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Import custom components
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import SearchBar from '@shared/components/forms/SearchBar.vue'

// Import types
import type { UserRole } from '@auth/types/IUser.types'
import type { PageHeaderAction } from '@shared/types/PageHeader.types'

const props = withDefaults(
  defineProps<{
    path: string[]
    title: string
    desc: string
    searchLabel?: string
    minRole: UserRole
    actions?: PageHeaderAction[] | PageHeaderAction[][]
  }>(),
  {
    actions: () => [],
  },
)

const query = defineModel<string>({ default: '' })

const totalActionsCount = computed(() => {
  if (!props.actions) return 0
  if (Array.isArray(props.actions[0])) {
    return (props.actions as PageHeaderAction[][]).reduce((sum, g) => sum + g.length, 0)
  }
  return (props.actions as PageHeaderAction[]).length
})

const singleAction = computed(() => {
  if (!props.actions || totalActionsCount.value !== 1) return null
  if (Array.isArray(props.actions[0])) {
    const activeGroups = (props.actions as PageHeaderAction[][]).filter(g => g.length > 0)
    return activeGroups[0]?.[0] || null
  }
  return (props.actions as PageHeaderAction[])[0]
})

const groupedActions = computed(() => {
  if (!props.actions || props.actions.length === 0) return []
  if (Array.isArray(props.actions[0])) {
    return props.actions as PageHeaderAction[][]
  }
  return [props.actions as PageHeaderAction[]]
})

const hasActions = computed(() => totalActionsCount.value > 0)
</script>

<style scoped>
.page-header__title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

/* Let the title column shrink (instead of forcing a wrap to a new row) so the action
   button stays on the title's row; the title/description wrap internally if needed. */
.page-header__title-col {
  min-width: 0;
}

.page-header__crumbs {
  font-size: 0.8125rem;
}
.page-header__crumbs :deep(.v-breadcrumbs-item) {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.page-header__crumbs :deep(.v-breadcrumbs-item--disabled) {
  color: rgba(var(--v-theme-on-surface), 0.78) !important;
  opacity: 1 !important;
}
.page-header__crumbs :deep(.v-breadcrumbs-divider) {
  opacity: 0.5;
}

/* Soft elevation on the primary CTA */
.page-header__cta {
  box-shadow: var(--bo-shadow-card) !important;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}
.page-header__cta:hover {
  box-shadow: var(--bo-shadow-raised) !important;
  transform: translateY(-1px);
}
</style>
