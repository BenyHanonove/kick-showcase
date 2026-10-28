<template>
  <auth-wrapper v-if="grandTotal > 0" :level="UserRole.ADMIN">
    <v-container class="pa-0 mb-4">
      <v-row dense>
        <v-col v-for="summary in activeSummaries" :key="summary.type" cols="6" sm="4" md="3">
          <v-card variant="flat" class="metric-card pa-4 rounded-xl h-100">
            <div class="d-flex align-center ga-2 mb-2">
              <v-avatar size="26" variant="tonal" :color="typeMeta[summary.type].color">
                <v-icon :icon="typeMeta[summary.type].icon" size="15" />
              </v-avatar>
              <span class="text-caption font-weight-medium text-medium-emphasis text-truncate">
                {{ summary.label }}
              </span>
            </div>

            <div class="metric-value">
              <span dir="ltr">{{ formatCurrency(summary.total) }}</span>
            </div>
            <div class="metric-sub text-medium-emphasis">
              כולל מע״מ ({{ VAT_PERCENT }}%) <span dir="ltr">{{ formatCurrency(addVat(summary.total)) }}</span>
            </div>
          </v-card>
        </v-col>

        <v-col v-if="showGrandTotal" cols="6" sm="4" md="3">
          <v-card variant="flat" class="metric-card metric-card--total pa-4 rounded-xl h-100">
            <div class="d-flex align-center ga-2 mb-2">
              <v-avatar size="26" variant="tonal" color="primary">
                <v-icon icon="mdi-cash-multiple" size="15" />
              </v-avatar>
              <span class="text-caption font-weight-bold text-primary text-truncate">
                סה"כ כללי
              </span>
            </div>

            <div class="metric-value text-primary">
              <span dir="ltr">{{ formatCurrency(grandTotal) }}</span>
            </div>
            <div class="metric-sub text-medium-emphasis">
              כולל מע״מ ({{ VAT_PERCENT }}%) <span dir="ltr">{{ formatCurrency(addVat(grandTotal)) }}</span>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </auth-wrapper>
</template>

<script setup lang="ts">
// Import vue APIs
import { computed } from 'vue'

// Import custom components
import AuthWrapper from '@auth/components/AuthWrapper.vue'

// Import stores
import { ProductsStore } from '@stores'

// Import composables
import { getConsumedCharge } from '@consume/composables/consume.calc'

// Import utils
import { addVat, VAT_PERCENT } from '@shared/utils/vat.util'
import { formatCurrency } from '@shared/utils/formatters.util'

// Import types
import type { IConsume } from '@consume/types/IConsume.types'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'
import { UserRole } from '@auth/types/IUser.types'

// Define props
const props = defineProps<{
  consumes: IConsume[]
  types: ProductType[]
}>()

// Active stores
const productsStore = ProductsStore()

// Presentation metadata per product type (icon + theme color)
const typeMeta: Record<ProductType, { icon: string; color: string }> = {
  [ProductType.ALCOHOL]: { icon: 'mdi-glass-cocktail', color: 'primary' },
  [ProductType.SODA]: { icon: 'mdi-bottle-soda-classic', color: 'info' },
  [ProductType.ENERGY_DRINK]: { icon: 'mdi-lightning-bolt', color: 'warning' },
  [ProductType.EQUIPMENT]: { icon: 'mdi-hammer-wrench', color: 'secondary' },
  [ProductType.DISPOSABLE]: { icon: 'mdi-cup-outline', color: 'teal' },
  [ProductType.ACCOMPANYING]: { icon: 'mdi-food-croissant', color: 'indigo' },
}

// Total cost charged to client for one record
const calcItemTotal = (c: IConsume) => getConsumedCharge(c)

// Calculate total consumption cost by product type
const getTotalByType = (type: ProductType) => {
  return props.consumes
    .filter((c) => productsStore.get(c.productId)?.type === type)
    .reduce((sum, c) => sum + calcItemTotal(c), 0)
}

// Computed properties
const activeSummaries = computed(() => {
  return props.types
    .map((type) => ({
      type,
      label: ProductTypeLabels[type],
      total: getTotalByType(type),
    }))
    .filter((s) => s.total > 0)
})

// Calculate grand total cost for all consumption records
const grandTotal = computed(() => {
  return props.consumes.reduce((sum, c) => sum + calcItemTotal(c), 0)
})

// Hide grand total on a single-type tab
const showGrandTotal = computed(() => props.types.length > 1)
</script>

<style scoped>
.metric-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(128, 128, 128, 0.15);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 4px 12px rgba(15, 23, 42, 0.06);
  transition: box-shadow 150ms ease;
}

.metric-card:hover {
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.08);
}

.metric-card--total {
  background: rgba(var(--v-theme-primary), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.25);
}

/* Stat value — proportional figures, ink by default; the avatar carries identity */
.metric-value {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: rgba(var(--v-theme-on-surface), 0.92);
  white-space: nowrap;
}

.metric-sub {
  font-size: 0.7rem;
  font-weight: 500;
  margin-top: 2px;
}

/* Two cards per row on phones — keep the value on one line */
@media (max-width: 599px) {
  .metric-card {
    padding: 12px !important;
  }
  .metric-value {
    font-size: 1.15rem;
  }
  .metric-sub {
    font-size: 0.65rem;
  }
}
</style>
