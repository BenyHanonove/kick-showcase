<template>
  <v-card
    class="pa-2 h-100 d-flex flex-column"
    rounded="lg"
    :elevation="hover ? 8 : 2"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <v-card-item class="pb-2">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-0">
          {{ sale.name }}
        </v-card-title>
        <v-menu v-model="menuOpen">
          <template v-slot:activator="{ props: menuProps }">
            <AppButton
              icon="mdi-dots-vertical"
              variant="text"
              size="x-small"
              aria-label="אפשרויות מכירה"
              v-bind="menuProps"
              @click.stop
            />
          </template>
          <AppList :actions="menuActions" />
        </v-menu>
      </div>
      <v-card-subtitle class="text-caption pa-0 mt-1">
        {{ client?.name || 'לקוח לא ידוע' }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="d-flex flex-column ga-2 py-2 flex-grow-1">
      <div class="d-flex align-center flex-wrap ga-2 text-caption text-medium-emphasis">
        <span class="d-inline-flex align-center ga-1">
          <v-icon size="13">mdi-calendar</v-icon>
          {{ formatDate(sale.datetime) }} · {{ formatTime(sale.datetime) }}
        </span>
      </div>

      <div class="d-flex align-center justify-end ga-2">
        <span class="text-caption text-medium-emphasis">שולם</span>
        <AppButton
          icon
          variant="text"
          :color="sale.paid ? 'success' : 'grey-lighten-1'"
          class="rounded-circle"
          size="small"
          :loading="paidLoading"
          @click.stop="togglePaid"
        >
          <v-icon
            :icon="sale.paid ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline'"
            size="26"
          />
        </AppButton>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-2">
      <AppButton color="primary" variant="text" size="small" @click.stop="goToDetails">ניהול</AppButton>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

// Import stores
import { ClientsStore, AuthStore, SnackbarStore } from '@stores'

// Import composables
import { useSummaryDownloader } from '@shared/composables/crud.composable'

// Import providers
import { saleProvider } from '@sale/providers/sale.provider'

// Import types
import type { ISale } from '@sale/types/ISale.types'
import type { IListAction } from '@shared/types/IListAction.types'

const props = defineProps<{
  sale: ISale
}>()

// Define events to notify the parent component
const emit = defineEmits<{
  (e: 'edit', sale: ISale): void
  (e: 'delete', id: string): void
  (e: 'update-paid', sale: ISale): void
}>()

const router = useRouter()
const hover = ref(false)
const menuOpen = ref(false)
const paidLoading = ref(false)

const togglePaid = async () => {
  paidLoading.value = true
  const result = await saleProvider.update(props.sale.id, {
    id: props.sale.id,
    timestamp: props.sale.timestamp,
    paid: !props.sale.paid,
  })
  paidLoading.value = false
  if (result.success && result.data) {
    emit('update-paid', result.data)
    SnackbarStore().open(result.message, 'success')
  } else {
    SnackbarStore().open(result.message, 'error')
  }
}

const { isSummarizing, handleSummary } = useSummaryDownloader(
  saleProvider.summary.bind(saleProvider),
)

const client = computed(() => ClientsStore().get(props.sale.clientId))

const onDownloadPdf = () => {
  handleSummary(props.sale.id)
}

const authStore = AuthStore()

// Menu actions — admin-only delete in own group
const menuActions = computed<IListAction[][]>(() => {
  const groups: IListAction[][] = [
    [
      { title: 'עדכן', icon: 'mdi-pencil', handler: () => emit('edit', props.sale) },
      {
        title: 'הורד PDF',
        icon: 'mdi-file-pdf-box',
        loading: isSummarizing.value,
        handler: onDownloadPdf,
      },
    ],
  ]
  if (authStore.isAdmin) {
    groups.push([
      { title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => emit('delete', props.sale.id) },
    ])
  }
  return groups
})

const goToDetails = () => {
  const clientId = props.sale.clientId || 'general'
  router.push({
    name: 'sale-details',
    params: { clientId, id: props.sale.id },
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

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
