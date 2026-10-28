<template>
  <v-container v-if="hasConsumes" class="pa-0 mb-6">
    <SummaryPanel
      v-model:open="isOpen"
      title="סיכום כספי מכירה"
      icon="mdi-trending-up"
      color="success"
      collapsible
      :metrics="metrics"
      :segments="segments"
      bar-label="הכנסה מול עלות:"
    >
      <SummaryBreakdown
        v-if="rows.length"
        :columns="columns"
        :rows="rows"
        :totals="totals"
        title="פירוט לפי קטגוריה:"
      />
    </SummaryPanel>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Import stores
import { SaleStore, ProductsStore } from '@stores'

// Import shared components
import SummaryPanel from '@shared/components/layout/SummaryPanel.vue'
import SummaryBreakdown from '@shared/components/data/SummaryBreakdown.vue'

// Import types
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'
import type { IConsume } from '@consume/types/IConsume.types'
import type {
  ISummaryMetric,
  ISummaryColumn,
  ISummaryRow,
} from '@shared/types/ISummaryMetric.types'
import type { ISegment } from '@shared/types/ISegment.types'

// Import composables
import { getConsumedQuantity, getConsumedCharge } from '@consume/composables/consume.calc'

// Initialize stores
const saleStore = SaleStore()
const productsStore = ProductsStore()

// State
const isOpen = ref(false)

// All consumes for this sale
const consumes = computed(() => saleStore.consumes?.data || [])
const hasConsumes = computed(() => consumes.value.length > 0)

// Helper: quantity sold for a single consume record
const calcQty = getConsumedQuantity

// What the client pays for a single record
const calcIncome = getConsumedCharge

// What it costs me for a single record (uses consume supplier price)
const calcCost = (c: IConsume) => calcQty(c) * (c.supplierPrice ?? 0)

// Grand totals
const grandTotals = computed(() => {
  const income = consumes.value.reduce((sum, c) => sum + calcIncome(c), 0)
  const cost = consumes.value.reduce((sum, c) => sum + calcCost(c), 0)
  return { income, cost, profit: income - cost }
})

// Total quantity across all consumes
const totalQty = computed(() => consumes.value.reduce((sum, c) => sum + calcQty(c), 0))

// Profit margin %
const profitMargin = computed(() => {
  if (grandTotals.value.income === 0) return 0
  return Math.round((grandTotals.value.profit / grandTotals.value.income) * 100)
})

// Per product-type breakdown
const typeBreakdown = computed(() => {
  return Object.values(ProductType)
    .map((type) => {
      const items = consumes.value.filter(
        (c) => productsStore.products?.find((p) => p.id === c.productId)?.type === type,
      )
      const qty = items.reduce((sum, c) => sum + calcQty(c), 0)
      const income = items.reduce((sum, c) => sum + calcIncome(c), 0)
      const cost = items.reduce((sum, c) => sum + calcCost(c), 0)
      return {
        type,
        label: ProductTypeLabels[type],
        qty,
        income,
        cost,
        profit: income - cost,
      }
    })
    .filter((s) => s.qty > 0)
    .sort((a, b) => b.income - a.income)
})

// Headline figures; the net metric is emphasised by the panel
const metrics = computed<ISummaryMetric[]>(() => [
  {
    key: 'income',
    label: 'מה שהלקוח משלם',
    shortLabel: 'הכנסה',
    value: grandTotals.value.income,
    icon: 'mdi-cash-plus',
    tone: 'positive',
  },
  {
    key: 'cost',
    label: 'עלות עבורי',
    shortLabel: 'עלות',
    value: grandTotals.value.cost,
    icon: 'mdi-cash-minus',
    tone: 'negative',
  },
  {
    key: 'profit',
    label: 'רווח נקי',
    shortLabel: 'רווח',
    value: grandTotals.value.profit,
    icon: grandTotals.value.profit >= 0 ? 'mdi-trending-up' : 'mdi-trending-down',
    tone: 'net',
    caption: `${profitMargin.value}% מרווח`,
  },
])

// Cost and profit sum to income, so the bar reads as a split of revenue
const segments = computed<ISegment[]>(() => [
  { label: 'עלות', value: grandTotals.value.cost, color: 'bg-error' },
  { label: 'רווח', value: Math.max(0, grandTotals.value.profit), color: 'bg-success' },
])

const columns: ISummaryColumn[] = [
  { key: 'qty', label: 'כמות', align: 'center', format: 'number' },
  { key: 'income', label: 'מחיר ללקוח', format: 'currency', tone: 'positive' },
  { key: 'cost', label: 'עלות', format: 'currency', tone: 'negative' },
  { key: 'profit', label: 'רווח', format: 'currency', tone: 'net' },
]

const rows = computed<ISummaryRow[]>(() =>
  typeBreakdown.value.map((item, index) => ({
    key: item.type,
    label: item.label,
    icon: typeIcon(item.type),
    iconColor: barColor(index),
    values: { qty: item.qty, income: item.income, cost: item.cost, profit: item.profit },
  })),
)

const totals = computed<Record<string, number>>(() => ({
  qty: totalQty.value,
  income: grandTotals.value.income,
  cost: grandTotals.value.cost,
  profit: grandTotals.value.profit,
}))

// Color helpers
const BAR_COLORS = ['primary', 'info', 'warning', 'secondary', 'error']
const barColor = (index: number) => BAR_COLORS[index % BAR_COLORS.length]

const TYPE_ICONS: Partial<Record<ProductType, string>> = {
  [ProductType.ALCOHOL]: 'mdi-bottle-wine',
  [ProductType.SODA]: 'mdi-cup',
  [ProductType.ENERGY_DRINK]: 'mdi-lightning-bolt',
  [ProductType.EQUIPMENT]: 'mdi-wrench',
  [ProductType.DISPOSABLE]: 'mdi-delete',
  [ProductType.ACCOMPANYING]: 'mdi-food',
}
const typeIcon = (type: string) => TYPE_ICONS[type as ProductType] || 'mdi-tag'
</script>
