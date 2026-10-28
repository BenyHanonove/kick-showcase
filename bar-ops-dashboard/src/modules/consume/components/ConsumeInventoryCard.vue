<template>
  <ModuleSummaryCard
    title="מלאי ופחת (Leakage Report)"
    icon="mdi-package-variant-closed"
    icon-color="orange"
    title-color="rgb(249, 115, 22)"
  >
    <!-- Top 3 Products by Charged Price -->
    <div class="metric-row mb-3">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-glass-mug-variant" size="20" />
        <span class="text-body-2 font-weight-medium">מוצרי הדגל המובילים (לפי מחיר נגבה)</span>
      </div>
      <template v-if="topProducts.length > 0">
        <div
          v-for="(item, idx) in topProducts"
          :key="item.productId"
          class="d-flex align-center justify-space-between py-2 px-3 rounded-lg mb-1"
          :style="{ background: idx === 0 ? 'rgba(249,115,22,0.06)' : 'transparent' }"
        >
          <div class="d-flex align-center ga-2">
            <v-avatar
              size="24"
              :color="idx === 0 ? 'orange' : idx === 1 ? 'grey-darken-1' : 'brown-lighten-1'"
              class="text-white text-caption font-weight-bold"
            >
              {{ idx + 1 }}
            </v-avatar>
            <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
          </div>
          <strong class="text-body-2">₪{{ formatNumber(item.totalValue) }}</strong>
        </div>
      </template>
      <div v-else class="text-caption text-medium-emphasis">אין נתוני צריכה</div>
    </div>

    <v-divider class="my-3" />

    <!-- Inventory Turnover per consume -->
    <div class="metric-row">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-cached" size="20" />
        <span class="text-body-2 font-weight-medium">ניצולת מלאי (שאריות / הגעה)</span>
      </div>
      <template v-if="inventoryTurnoverGroups.length > 0">
        <div v-for="(group, idx) in inventoryTurnoverGroups" :key="group.type" class="mb-2">
          <v-divider v-if="idx > 0" class="mb-2" />
          <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-1">
            {{ group.label }}
          </div>
          <div
            v-for="item in group.items"
            :key="item.productId"
            class="d-flex align-center justify-space-between py-1"
          >
            <span class="text-body-2">{{ item.name }}</span>
            <div class="d-flex align-center ga-2">
              <v-progress-linear
                :model-value="item.leftoverPercent"
                color="primary"
                rounded
                height="8"
                class="progress-bar-compact"
              />
              <span class="text-caption font-weight-bold pct-label">
                {{ formatNumber(item.leftoverPercent) }}%
              </span>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="text-caption text-medium-emphasis">אין נתוני צריכה</div>
    </div>

    <v-divider class="my-3" />

    <!-- Revenue by product category -->
    <div class="metric-row">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-chart-pie-outline" size="20" />
        <span class="text-body-2 font-weight-medium">מחיר שנגבה לפי קטגוריה</span>
      </div>
      <template v-if="revenueByCategory.length > 0">
        <div
          v-for="item in revenueByCategory"
          :key="item.type"
          class="d-flex align-center justify-space-between py-1"
        >
          <span class="text-body-2">{{ item.label }}</span>
          <strong class="text-body-2 text-success">₪{{ formatNumber(item.revenue) }}</strong>
        </div>
      </template>
      <div v-else class="text-caption text-medium-emphasis">אין נתוני קטגוריות</div>
    </div>
  </ModuleSummaryCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SessionStore, ProductsStore } from '@stores'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'
import ModuleSummaryCard from '@shared/components/layout/ModuleSummaryCard.vue'
import { getConsumedCharge } from '@consume/composables/consume.calc'
import { formatNumber } from '@shared/utils/formatters.util'

const sessionStore = SessionStore()
const productsStore = ProductsStore()

const consumes = computed(() => sessionStore.consumes?.data || [])

const topProducts = computed(() => {
  return consumes.value
    .map((c) => {
      const totalValue = getConsumedCharge(c)
      const product = productsStore.get(c.productId)
      return { productId: c.productId, name: product?.name || 'מוצר לא ידוע', totalValue }
    })
    .filter((x) => x.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 3)
})

const inventoryTurnover = computed(() => {
  return consumes.value
    .map((c) => {
      const totalArrived = (c.arrived || 0) + (c.fromStorage || 0)
      const leftover = (c.returnedToStorage || 0) + (c.creditedToSupplier || 0)
      const leftoverPercent = totalArrived > 0 ? (leftover / totalArrived) * 100 : 0
      const product = productsStore.get(c.productId)
      return {
        productId: c.productId,
        name: product?.name || 'מוצר לא ידוע',
        leftoverPercent,
        totalArrived,
        leftover,
        type: (product?.type ?? 'other') as ProductType | 'other',
      }
    })
    .filter((x) => x.totalArrived > 0)
    .sort((a, b) => b.leftoverPercent - a.leftoverPercent)
})

const TYPE_GROUP_ORDER = [ProductType.ALCOHOL, ProductType.SODA, ProductType.ENERGY_DRINK]

const inventoryTurnoverGroups = computed(() => {
  const byType: Record<string, { label: string; items: typeof inventoryTurnover.value }> = {}
  for (const item of inventoryTurnover.value) {
    const key = item.type
    if (!byType[key]) {
      byType[key] = {
        label: ProductTypeLabels[key as ProductType] || key,
        items: [],
      }
    }
    byType[key].items.push(item)
  }
  const ordered: { type: string; label: string; items: typeof inventoryTurnover.value }[] = []
  for (const type of TYPE_GROUP_ORDER) {
    if (byType[type]) ordered.push({ type, ...byType[type] })
  }
  for (const [type, group] of Object.entries(byType)) {
    if (!TYPE_GROUP_ORDER.includes(type as ProductType)) {
      ordered.push({ type, ...group })
    }
  }
  return ordered
})

const revenueByCategory = computed(() => {
  const map: Record<string, { type: string; label: string; revenue: number }> = {}
  for (const c of consumes.value) {
    const product = productsStore.get(c.productId)
    if (!product) continue
    const type = product.type
    const revenue = getConsumedCharge(c)
    if (!map[type]) {
      map[type] = { type, label: ProductTypeLabels[type as ProductType] || type, revenue: 0 }
    }
    map[type].revenue += revenue
  }
  return Object.values(map)
    .filter((x) => x.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
})
</script>

<style scoped>
.metric-row {
  padding: 4px 0;
}

/* Compact progress bar for inventory turnover rows */
.progress-bar-compact {
  width: 80px;
}

/* Percentage label with fixed width for alignment */
.pct-label {
  min-width: 38px;
  text-align: left;
}
</style>
