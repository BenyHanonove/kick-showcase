<template>
  <v-card
    class="session-card pa-2 h-100 d-flex flex-column"
    :class="{ 'session-card--hover': hover }"
    rounded="lg"
    :elevation="0"
    :style="{ '--session-accent': accentColor }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <v-card-item class="pb-2">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-0">
          {{ session.name }}
        </v-card-title>
        <auth-wrapper :level="UserRole.ADMIN">
          <v-menu v-model="menuOpen">
            <template v-slot:activator="{ props: menuProps }">
              <AppButton
                icon="mdi-dots-vertical"
                variant="text"
                size="x-small"
                aria-label="אפשרויות אירוע"
                v-bind="menuProps"
                @click.stop
              />
            </template>
            <AppList :actions="menuActions" />
          </v-menu>
        </auth-wrapper>
      </div>
      <v-card-subtitle class="text-caption pa-0 mt-1">
        {{ client?.name || 'לקוח לא ידוע' }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="d-flex flex-column ga-2 py-2 flex-grow-1">
      <div class="d-flex align-center ga-1 text-caption text-medium-emphasis">
        <v-icon size="13">mdi-calendar</v-icon>
        {{ formatDate(session.datetime) }}
      </div>

      <div class="d-flex align-center ga-1 text-caption text-medium-emphasis">
        <v-icon size="13" color="primary">mdi-account-group</v-icon>
        {{ session.peopleAmount }} אורחים
      </div>

      <div class="d-flex align-center ga-1 text-caption text-medium-emphasis">
        <v-icon size="13">mdi-map-marker</v-icon>
        {{ session.location }}
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-2">
      <AppButton color="primary" variant="text" size="small" @click.stop="goToDetails">ניהול</AppButton>
      <v-spacer />
      <StatusChip :meta="statusMeta" size="x-small" />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

// Import stores
import { ClientsStore } from '@stores'

// Import custom components
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import StatusChip from '@shared/components/data/StatusChip.vue'

// Import types
import { UserRole } from '@auth/types/IUser.types'
import type { ISession } from '@session/types/ISession.types'
import { getSessionStatusMeta } from '@session/types/status.types'
import type { IListAction } from '@shared/types/IListAction.types'

const props = defineProps<{
  session: ISession
}>()

// Define events to notify the parent component
const emit = defineEmits(['edit', 'delete'])

const router = useRouter()
const theme = useTheme()
const hover = ref(false)
const menuOpen = ref(false)

// Menu actions — destructive actions sit in their own group
const menuActions: IListAction[][] = [
  [{ title: 'עריכה', icon: 'mdi-pencil', handler: () => emit('edit', props.session) }],
  [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => emit('delete', props.session.id) }],
]

const client = computed(() => ClientsStore().get(props.session.clientId))

const statusMeta = computed(() => getSessionStatusMeta(props.session.status))

// Resolve status color to hex for the accent strip
const accentColor = computed(
  () => theme.current.value.colors[statusMeta.value.color] ?? statusMeta.value.color,
)

const goToDetails = () => {
  const clientId = props.session.clientId || 'general'
  router.push({
    name: 'session-details',
    params: { clientId, id: props.session.id },
  })
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style scoped>
.session-card {
  position: relative;
  overflow: hidden;
  box-shadow: var(--bo-shadow-card) !important;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

/* RTL-aware status accent strip on the inline-start edge */
.session-card::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 4px;
  background-color: var(--session-accent);
}

.session-card--hover {
  box-shadow: var(--bo-shadow-raised) !important;
  transform: translateY(-2px);
}
</style>
