<template>
  <v-container>
    <AppButton
      prepend-icon="mdi-arrow-right"
      variant="text"
      class="mb-4 font-weight-bold"
      @click="router.push(parentPath)"
    >
      חזור ל{{ parentName }}
    </AppButton>

    <!-- Loading State -->
    <v-row v-if="isProductsLoading" class="mt-10" justify="center">
      <v-col cols="auto" class="text-center">
        <v-progress-circular indeterminate color="primary" size="50" width="4" />
        <div class="text-body-2 mt-2 text-medium-emphasis">טוען נתונים...</div>
      </v-col>
    </v-row>

    <!-- Products Tables & Actions -->
    <template v-else-if="hasProducts">
      <div v-for="(items, type) in groupedProducts" :key="type" class="mb-10">
        <h2 class="text-h5 mb-4 mr-2">
          {{ ProductTypeLabels[type as keyof typeof ProductTypeLabels] }}
        </h2>

        <AppTable :headers="menuTableHeaders" :items="items" class="elevation-1 rounded-lg">
          <template #name="{ value }">
            {{ value }}
          </template>
          <template #supplier="{ item }">
            {{ getSupplierName(item.supplierId as string) }}
          </template>
          <template #volume="{ item }">
            {{ item.volume }}
            {{
              ['equipment', 'disposable', 'accompanying'].includes(item.type as string)
                ? 'יח'
                : 'מ״ל'
            }}
          </template>
          <template #isBase="{ item }">
            <div class="d-flex justify-center">
              <v-checkbox-btn v-model="item.isBase" color="primary" />
            </div>
          </template>
        </AppTable>
      </div>

      <v-row class="mt-6" justify="end">
        <v-col cols="auto">
          <AppButton color="primary" size="large" :loading="isBulkUpdating" @click="handleUpdateMenu">
            עדכון תפריט
          </AppButton>
        </v-col>
      </v-row>
    </template>

    <!-- Empty State -->
    <div v-else class="text-center mt-10">
      <EmptyState icon="mdi-package-variant-closed" feature="מוצרים לניהול תפריט" />
      <AppButton color="primary" variant="tonal" class="mt-4" @click="router.push(parentPath)">
        חזור
      </AppButton>
    </div>
  </v-container>
</template>

<script setup lang="ts">
// Import vue APIs
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

// Import stores and composables
import { ProductsStore, SuppliersStore } from '@stores'
import { useProductCrud } from '@product/composables/product.crud'

// Import custom components
import EmptyState from '@shared/components/data/EmptyState.vue'
import AppTable from '@shared/components/data/AppTable.vue'

// Import types
import type { IProduct } from '@product/types/IProduct.types'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'

const menuTableHeaders = [
  { key: 'name', label: 'שם מוצר' },
  { key: 'supplier', label: 'ספק' },
  { key: 'volume', label: 'נפח/כמות' },
  { key: 'isBase', label: 'בתפריט', align: 'center' as const },
]

// Define props
const props = defineProps<{
  allowedTypes: ProductType[]
}>()

// Initialize routes, router, and stores
const route = useRoute()
const router = useRouter()
const productsStore = ProductsStore()
const suppliersStore = SuppliersStore()

const { products, loading: isProductsLoading } = storeToRefs(productsStore)

// Dynamically determine which types to display
const activeTypes = computed<ProductType[]>(() => {
  const queryType = route.query.type
  if (queryType) {
    if (Array.isArray(queryType)) {
      return queryType as ProductType[]
    }
    return queryType.toString().split(',') as ProductType[]
  }
  return props.allowedTypes || Object.values(ProductType)
})

// Computed properties for breadcrumb titles and paths
const parentName = computed(() => 'מוצרים')

const parentPath = computed(() => {
  const path = '/products'

  if (route.query.type) {
    return { path, query: { type: route.query.type } }
  }
  return { path }
})

// Group products by their types
const groupedProducts = computed(() => {
  if (!products.value) return {}
  return products.value.reduce(
    (acc, product) => {
      if (activeTypes.value.includes(product.type)) {
        const bucket = acc[product.type] ?? (acc[product.type] = [])
        bucket.push(product)
      }
      return acc
    },
    {} as Record<string, IProduct[]>,
  )
})

// Get supplier name by ID helper
const getSupplierName = (supplierId: string) => suppliersStore.get(supplierId)?.name || 'לא נמצא'

// Initialize product CRUD actions and bulk update snapshot state
const { isBulkUpdating, handleBulkUpdate, takeSnapshot } = useProductCrud(productsStore)

// Snapshot original isBase values for bulk-update diff
onMounted(() => takeSnapshot())

// Handle menu updates submission
const handleUpdateMenu = () => handleBulkUpdate(products.value || [], 'isBase')

// Determine if there are products to show
const hasProducts = computed(() => {
  return Object.values(groupedProducts.value).some((list) => list.length > 0)
})
</script>
