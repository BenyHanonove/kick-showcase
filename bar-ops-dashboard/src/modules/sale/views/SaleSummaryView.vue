<template>
  <v-container>
    <PageHeader
      :path="['בית', 'מכירות', 'סיכום לפי חודש']"
      title="סיכום מכירות"
      :desc="`עלות ומחיר מכירה עבור ${monthYear}`"
      :min-role="UserRole.ADMIN"
    />

    <global-loading v-if="loading" />

    <template v-else>
      <!-- Totals -->
      <v-row dense class="mt-4 mb-2">
        <v-col cols="12" sm="4">
          <v-card variant="flat" class="pa-3 rounded-xl text-center border">
            <v-icon icon="mdi-cash-plus" color="success" class="mb-1 text-h5" />
            <div class="text-caption text-medium-emphasis">סה"כ מחיר ללקוח</div>
            <div class="text-h5 font-weight-black text-success mt-1">
              {{ formatCurrency(totals.soldPrice) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="flat" class="pa-3 rounded-xl text-center border">
            <v-icon icon="mdi-cash-minus" color="error" class="mb-1 text-h5" />
            <div class="text-caption text-medium-emphasis">סה"כ עלות</div>
            <div class="text-h5 font-weight-black text-error mt-1">
              {{ formatCurrency(totals.costPrice) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="flat" class="pa-3 rounded-xl text-center border">
            <v-icon icon="mdi-trending-up" color="primary" class="mb-1 text-h5" />
            <div class="text-caption text-medium-emphasis">סה"כ רווח</div>
            <div class="text-h5 font-weight-black text-primary mt-1">
              {{ formatCurrency(totals.profit) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Per-sale breakdown -->
      <AppTable
        :headers="tableHeaders"
        :items="rows"
        empty-icon="mdi-file-chart-outline"
        empty-feature="סיכומי מכירות"
      >
        <template #datetime="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #clientId="{ value }">
          {{ clientsStore.get(value as string)?.brand || 'לקוח לא ידוע' }}
        </template>

        <template #soldPrice="{ value }">
          <span class="text-success font-weight-bold">{{ formatCurrency(value as number) }}</span>
        </template>

        <template #costPrice="{ value }">
          <span class="text-error font-weight-bold">{{ formatCurrency(value as number) }}</span>
        </template>

        <template #profit="{ value }">
          <span
            class="font-weight-bold"
            :class="(value as number) >= 0 ? 'text-primary' : 'text-warning'"
          >
            {{ formatCurrency(value as number) }}
          </span>
        </template>

        <template #paid="{ item }">
          <AppButton
            icon
            variant="text"
            :color="item.paid ? 'success' : 'grey-lighten-1'"
            class="rounded-circle"
            size="small"
            :loading="paidLoading[item.id]"
            @click.stop="togglePaid(item)"
          >
            <v-icon
              :icon="item.paid ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline'"
              size="26"
            />
          </AppButton>
        </template>
      </AppTable>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { ClientsStore, SnackbarStore } from '@stores'

import { saleProvider } from '@sale/providers/sale.provider'

import PageHeader from '@shared/components/layout/PageHeader.vue'
import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'
import AppTable from '@shared/components/data/AppTable.vue'
import type { TableHeader } from '@shared/components/data/AppTable.vue'

import { formatCurrency, formatDate } from '@shared/utils/formatters.util'

import { UserRole } from '@auth/types/IUser.types'
import type { ISaleSummary } from '@sale/types/ISale.types'

const route = useRoute()
const clientsStore = ClientsStore()

const monthYear = (route.query.monthYear as string) || ''
const loading = ref(false)
const summaries = ref<ISaleSummary[]>([])
const paidLoading = ref<Record<string, boolean>>({})

onMounted(async () => {
  if (!monthYear) return
  loading.value = true
  const result = await saleProvider.summaryByMonth(monthYear)
  if (result.success && result.data) {
    summaries.value = result.data
  }
  loading.value = false
})

const togglePaid = async (sale: ISaleSummary) => {
  paidLoading.value[sale.id] = true
  const result = await saleProvider.update(sale.id, {
    id: sale.id,
    timestamp: sale.timestamp,
    paid: !sale.paid,
  })
  paidLoading.value[sale.id] = false
  if (result.success && result.data) {
    const target = summaries.value.find((s) => s.id === sale.id)
    if (target) target.paid = result.data.paid
    SnackbarStore().open(result.message, 'success')
  } else {
    SnackbarStore().open(result.message, 'error')
  }
}

// Rows enriched with a real "profit" field so the table can sort/export it
type ISaleSummaryRow = ISaleSummary & { profit: number }

const rows = computed<ISaleSummaryRow[]>(() =>
  summaries.value.map((s) => ({ ...s, profit: s.soldPrice - s.costPrice })),
)

const totals = computed(() => {
  const soldPrice = summaries.value.reduce((sum, s) => sum + s.soldPrice, 0)
  const costPrice = summaries.value.reduce((sum, s) => sum + s.costPrice, 0)
  return { soldPrice, costPrice, profit: soldPrice - costPrice }
})

const tableHeaders: TableHeader<ISaleSummaryRow>[] = [
  { key: 'name', label: 'שם מכירה' },
  { key: 'datetime', label: 'תאריך' },
  { key: 'clientId', label: 'לקוח' },
  { key: 'soldPrice', label: 'מחיר ללקוח' },
  { key: 'costPrice', label: 'עלות' },
  { key: 'profit', label: 'רווח' },
  { key: 'paid', label: 'שולם' },
]
</script>
