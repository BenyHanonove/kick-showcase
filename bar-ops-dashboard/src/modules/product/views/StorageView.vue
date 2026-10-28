<template>
  <v-container class="pa-4">
    <PageHeader
      v-model="query"
      :path="pageBreadcrumbs"
      :title="pageTitle"
      :desc="pageDesc"
      search-label="חפש מוצר במלאי המחסן..."
      :min-role="UserRole.ADMIN"
      :actions="pageHeaderActions"
    />

    <!-- Filter Tabs -->
    <v-tabs v-model="activeTab" align-tabs="start" color="primary" class="border-b mb-6">
      <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
        {{ tab.label }}
      </v-tab>
    </v-tabs>

    <!-- Loading State -->
    <v-row v-if="isProductsLoading" class="mt-10" justify="center">
      <v-col cols="auto" class="text-center">
        <v-progress-circular indeterminate color="primary" size="50" width="4" />
        <div class="text-body-2 mt-2 text-medium-emphasis">טוען נתונים...</div>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Tables Split by Type -->
      <div v-if="hasResults" class="d-flex flex-column ga-6 mt-6">
        <template v-for="type in orderedTypes" :key="type">
          <div v-if="groupedResults[type] && groupedResults[type].length > 0" class="mb-6">
            <h2 class="text-h5 mb-4 mr-2">{{ ProductTypeLabels[type] }}</h2>

            <AppTable
              :headers="storageTableHeaders"
              :items="groupedResults[type]"
              class="text-right"
            >
              <template #name="{ value }">
                <span class="font-weight-medium">{{ value }}</span>
              </template>
              <template #quantity="{ item }">
                <v-chip
                  :color="(item.quantity as number) > 0 ? 'success' : 'error'"
                  size="small"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ item.quantity }} יחידות
                </v-chip>
              </template>
            </AppTable>
          </div>
        </template>
      </div>

      <!-- Empty State -->
      <v-row v-else class="mt-10 text-center" justify="center">
        <v-col cols="12" class="d-flex flex-column align-center ga-2">
          <v-icon size="64" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
          <div class="text-h6 text-medium-emphasis">לא נמצאו מוצרים תואמים לחיפוש</div>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import AppTable from '@shared/components/data/AppTable.vue'
import { ProductsStore } from '@stores'
import { useSearch } from '@shared/composables/useSearch.composable'
import { useRouteQueryTab } from '@shared/composables/useRouteQueryTab.composable'
import { useAppInitialization } from '@shared/composables/app-init.service'
import { UserRole } from '@auth/types/IUser.types'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'
import type { IProduct } from '@product/types/IProduct.types'
import type { PageHeaderAction } from '@shared/types/PageHeader.types'

const storageTableHeaders = [
  { key: 'name', label: 'שם מוצר', align: 'right' as const },
  { key: 'quantity', label: 'כמות פיזית במלאי', align: 'right' as const },
]

const pageHeaderActions = computed<PageHeaderAction[]>(() => [
  {
    label: 'עדכון מלאי',
    action: () => {
      router.push({ name: 'storage-bulk' })
    },
    icon: 'mdi-pencil-box-multiple-outline',
  },
])

// Initialize router, routes, and products store
const router = useRouter()
const productsStore = ProductsStore()
const { products, loading: isProductsLoading } = storeToRefs(productsStore)

const { query, results } = useSearch(products, ['name'])

// Trigger data loading if needed
onMounted(() => {
  if (!products.value || products.value.length === 0) {
    useAppInitialization().loadDashboardData()
  }
})

// Active tab state
const activeTab = useRouteQueryTab(
  'type',
  'all',
  computed(() => ['all', ...Object.values(ProductType)]),
)
// Unified tab list showing all base types
const tabs = [
  { value: 'all', label: 'הכל' },
  { value: ProductType.ALCOHOL, label: ProductTypeLabels[ProductType.ALCOHOL] },
  { value: ProductType.SODA, label: ProductTypeLabels[ProductType.SODA] },
  { value: ProductType.ENERGY_DRINK, label: ProductTypeLabels[ProductType.ENERGY_DRINK] },
  { value: ProductType.ACCOMPANYING, label: ProductTypeLabels[ProductType.ACCOMPANYING] },
  { value: ProductType.DISPOSABLE, label: ProductTypeLabels[ProductType.DISPOSABLE] },
  { value: ProductType.EQUIPMENT, label: ProductTypeLabels[ProductType.EQUIPMENT] },
]

// Metadata config
const pageTitle = computed(() => 'מלאי מחסן')
const pageDesc = computed(() => 'ניהול ומעקב אחר מלאי המוצרים הפיזיים במחסן')
const pageBreadcrumbs = computed(() => ['בית', 'מוצרים', 'מלאי מחסן'])

// Tab order list
const orderedTypes = [
  ProductType.ALCOHOL,
  ProductType.SODA,
  ProductType.ENERGY_DRINK,
  ProductType.ACCOMPANYING,
  ProductType.EQUIPMENT,
  ProductType.DISPOSABLE,
]

// Grouped products filtered by query and tab
const groupedResults = computed(() => {
  const selectedType = activeTab.value
  const allowedTypes = [
    ProductType.ALCOHOL,
    ProductType.SODA,
    ProductType.ENERGY_DRINK,
    ProductType.ACCOMPANYING,
    ProductType.EQUIPMENT,
    ProductType.DISPOSABLE,
  ]

  return results.value.reduce(
    (acc, product) => {
      const matchTab =
        selectedType === 'all' ? allowedTypes.includes(product.type) : product.type === selectedType
      const hasQuantity = (product.quantity ?? 0) > 0

      if (matchTab && hasQuantity) {
        const bucket = acc[product.type] ?? (acc[product.type] = [])
        bucket.push(product)
      }
      return acc
    },
    {} as Record<string, IProduct[]>,
  )
})

const hasResults = computed(() => {
  return Object.values(groupedResults.value).some((list) => list && list.length > 0)
})
</script>
