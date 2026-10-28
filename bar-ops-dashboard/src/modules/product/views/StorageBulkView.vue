<template>
  <v-container class="pa-4 pb-24">
    <v-row class="mb-4 align-center">
      <v-col class="d-flex align-center">
        <AppButton
          icon="mdi-arrow-right"
          variant="text"
          class="me-3"
          @click="router.push({ name: 'storage' })"
        />
        <div>
          <h2 class="text-h4 d-inline-block font-weight-bold mb-1">עדכון מלאי מהיר</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            עדכן את כמויות המוצרים במלאי המחסן של הבר
          </p>
        </div>
      </v-col>
    </v-row>

    <!-- Search query -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-text-field
          v-model="query"
          prepend-inner-icon="mdi-magnify"
          label="חפש מוצר..."
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
        />
      </v-col>
    </v-row>

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
      <div v-if="hasResults" class="d-flex flex-column ga-6">
        <v-card variant="flat" border class="rounded-lg">
          <v-list class="pa-0">
            <template v-slot:default>
              <template v-for="type in orderedTypes" :key="type">
                <div v-if="groupedResults[type] && groupedResults[type].length > 0">
                  <v-list-subheader
                    class="text-secondary font-weight-black text-subtitle-1 py-4 px-4"
                  >
                    {{ ProductTypeLabels[type] }}
                  </v-list-subheader>

                  <template v-for="product in groupedResults[type]" :key="product.id">
                    <StorageBulkItem ref="itemRefs" :product="product" />
                  </template>
                  <v-divider />
                </div>
              </template>
            </template>
          </v-list>
        </v-card>
      </div>

      <!-- Empty State -->
      <v-row v-else class="mt-10 text-center" justify="center">
        <v-col cols="12" class="d-flex flex-column align-center ga-2">
          <v-icon size="64" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
          <div class="text-h6 text-medium-emphasis">לא נמצאו מוצרים תואמים</div>
        </v-col>
      </v-row>
    </template>
  </v-container>

  <!-- Sticky save button — teleported to body to escape v-main overflow -->
  <Teleport to="body">
    <div class="sticky-save-wrapper">
      <div
        class="pa-4 sticky-save-panel"
      >
        <AppButton block size="large" color="primary" class="sticky-save-btn" :loading="isBulkUpdating" @click="onSubmit">
          שמור שינויים במלאי
        </AppButton>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ProductsStore } from '@stores'
import { useSearch } from '@shared/composables/useSearch.composable'
import { useProductCrud } from '@product/composables/product.crud'
import { useRouteQueryTab } from '@shared/composables/useRouteQueryTab.composable'
import { useAppInitialization } from '@shared/composables/app-init.service'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'
import type { IProduct } from '@product/types/IProduct.types'
import StorageBulkItem from '@product/components/StorageBulkItem.vue'

const router = useRouter()
const productsStore = ProductsStore()
const { products, loading: isProductsLoading } = storeToRefs(productsStore)

const { query, results } = useSearch(products, ['name'])

// Crud actions
const { isBulkUpdating, handleBulkUpdate, takeSnapshot } = useProductCrud(productsStore)

// Take snapshot of quantity to compare for changes
onMounted(() => {
  if (!products.value || products.value.length === 0) {
    useAppInitialization()
      .loadDashboardData()
      .then(() => {
        takeSnapshot()
      })
  } else {
    takeSnapshot()
  }
})

// Active tab state
const activeTab = useRouteQueryTab(
  'type',
  'all',
  computed(() => ['all', ...Object.values(ProductType)]),
)

// Tabs config
const tabs = [
  { value: 'all', label: 'הכל' },
  { value: ProductType.ALCOHOL, label: ProductTypeLabels[ProductType.ALCOHOL] },
  { value: ProductType.SODA, label: ProductTypeLabels[ProductType.SODA] },
  { value: ProductType.ENERGY_DRINK, label: ProductTypeLabels[ProductType.ENERGY_DRINK] },
  { value: ProductType.ACCOMPANYING, label: ProductTypeLabels[ProductType.ACCOMPANYING] },
  { value: ProductType.DISPOSABLE, label: ProductTypeLabels[ProductType.DISPOSABLE] },
  { value: ProductType.EQUIPMENT, label: ProductTypeLabels[ProductType.EQUIPMENT] },
]

// Ordered types list
const orderedTypes = [
  ProductType.ALCOHOL,
  ProductType.SODA,
  ProductType.ENERGY_DRINK,
  ProductType.ACCOMPANYING,
  ProductType.EQUIPMENT,
  ProductType.DISPOSABLE,
]

// Grouped products filtered by tab and query, no quantity filter
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

      if (matchTab) {
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

// Reference to child component instances
const itemRefs = ref<{ getSubmitData: () => { id: string; quantity: number } }[]>([])

// Submit bulk updates
const onSubmit = async () => {
  const payload = itemRefs.value.map((refInstance) => refInstance.getSubmitData())

  const updatedItems = payload.map((p) => {
    const originalItem = productsStore.get(p.id)
    return {
      ...originalItem,
      quantity: p.quantity,
    } as IProduct
  })

  const result = await handleBulkUpdate(updatedItems, 'quantity')
  if (result === 'success') {
    router.push({ name: 'storage' })
  }
}
</script>

<style scoped>
/* Sticky save bar — teleported to body to escape v-main overflow */
.sticky-save-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  pointer-events: none;
  /* Fades from the page background into transparent, no hard edge */
  padding-top: 32px;
  background: linear-gradient(
    to top,
    rgb(var(--v-theme-background)) 60%,
    rgba(var(--v-theme-background), 0)
  );
}

.sticky-save-panel {
  width: 100%;
  max-width: 600px;
  pointer-events: auto;
}
</style>
