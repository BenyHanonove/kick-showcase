<template>
  <v-container class="pa-4">
    <PageHeader
      v-model="query"
      :path="pageBreadcrumbs"
      :title="pageTitle"
      :desc="pageDesc"
      search-label="חפש לפי שם..."
      :min-role="UserRole.ADMIN"
      :actions="pageHeaderActions"
    />

    <!-- Filter Tabs -->
    <v-tabs v-model="activeTab" align-tabs="start" color="primary" class="border-b mb-6">
      <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
        {{ tab.label }}
      </v-tab>
    </v-tabs>

    <v-row v-if="isProductsLoading" class="mt-10" justify="center">
      <v-col cols="auto" class="text-center">
        <v-progress-circular indeterminate color="primary" size="50" width="4" />
        <div class="text-body-2 mt-2 text-medium-emphasis">טוען נתונים...</div>
      </v-col>
    </v-row>

    <div v-else-if="results && results.length > 0" class="d-flex flex-column ga-6 mt-6">
      <!-- "All" Tab: Original category grouping -->
      <template v-if="isAllTab">
        <template v-for="type in orderedTypes" :key="type">
          <div
            v-if="filteredGroupedProducts[type] && filteredGroupedProducts[type].length > 0"
            class="mb-6"
          >
            <h2 class="text-h5 mb-4 mr-2">{{ ProductTypeLabels[type] }}</h2>
            <AppTable
              :headers="getProductHeaders(isTypeSimple(type))"
              :items="filteredGroupedProducts[type]"
            >
              <template #name="{ value }">
                <span class="font-weight-medium">{{ value }}</span>
              </template>
              <template #supplier="{ item }">
                {{ getSupplierName(item.supplierId as string) }}
              </template>
              <template #price="{ value }"> ₪{{ value }} </template>
              <template #priceIncl="{ item }">
                ₪{{ formatNumber(addVat(item.price as number)) }}
              </template>
              <template #volume="{ item }">
                {{ item.volume }}
                {{
                  ['equipment', 'disposable', 'accompanying'].includes(item.type as string)
                    ? 'יח'
                    : 'מ״ל'
                }}
              </template>
              <template #actions="{ item }">
                <v-progress-circular
                  v-if="
                    ProductCrud.isDeleting.value && ProductCrud.selectedItem.value?.id === item.id
                  "
                  indeterminate
                  size="20"
                  width="2"
                  color="error"
                />
                <v-menu
                  v-else
                  :model-value="!!menuStates[item.id as string]"
                  @update:model-value="(val) => (menuStates[item.id as string] = val)"
                >
                  <template #activator="{ props: menuProps }">
                    <AppButton
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                      color="medium-emphasis"
                      v-bind="menuProps"
                      class="rounded-circle"
                    />
                  </template>
                  <AppList :actions="itemMenuActions(item as unknown as IProduct)" />
                </v-menu>
              </template>
            </AppTable>
          </div>
        </template>
      </template>

      <!-- Specific Tab: Supplier grouping -->
      <template v-else>
        <template v-for="supplierId in sortedSupplierIds" :key="supplierId">
          <div
            v-if="
              supplierGroupedProducts[supplierId] && supplierGroupedProducts[supplierId].length > 0
            "
            class="mb-6"
          >
            <h2 class="text-h5 mb-4 mr-2">{{ getSupplierName(supplierId) }}</h2>
            <AppTable
              :headers="getProductHeaders(isCurrentTypeSimple)"
              :items="supplierGroupedProducts[supplierId]"
            >
              <template #name="{ value }">
                <span class="font-weight-medium">{{ value }}</span>
              </template>
              <template #supplier="{ item }">
                {{ getSupplierName(item.supplierId as string) }}
              </template>
              <template #price="{ value }"> ₪{{ value }} </template>
              <template #priceIncl="{ item }">
                ₪{{ formatNumber(addVat(item.price as number)) }}
              </template>
              <template #volume="{ item }">
                {{ item.volume }}
                {{
                  ['equipment', 'disposable', 'accompanying'].includes(item.type as string)
                    ? 'יח'
                    : 'מ״ל'
                }}
              </template>
              <template #actions="{ item }">
                <v-progress-circular
                  v-if="
                    ProductCrud.isDeleting.value && ProductCrud.selectedItem.value?.id === item.id
                  "
                  indeterminate
                  size="20"
                  width="2"
                  color="error"
                />
                <v-menu
                  v-else
                  :model-value="!!menuStates[item.id as string]"
                  @update:model-value="(val) => (menuStates[item.id as string] = val)"
                >
                  <template #activator="{ props: menuProps }">
                    <AppButton
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                      color="medium-emphasis"
                      v-bind="menuProps"
                      class="rounded-circle"
                    />
                  </template>
                  <AppList :actions="itemMenuActions(item as unknown as IProduct)" />
                </v-menu>
              </template>
            </AppTable>
          </div>
        </template>
      </template>
    </div>

    <v-row v-else class="mt-10 text-center" justify="center">
      <v-col cols="12" class="d-flex flex-column align-center ga-2">
        <v-icon size="64" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
        <div class="text-h6 text-medium-emphasis">לא נמצאו פריטים</div>
      </v-col>
    </v-row>

    <!-- Dialogs Wrapper -->
    <ProductDialogs
      :ProductCrud="ProductCrud"
      :suppliers="suppliers || []"
      :isEquipmentMode="isEquipmentMode"
      :activeTab="activeTab"
      v-model:createOpen="ProductCrud.createDialogOpen.value"
      v-model:updateOpen="ProductCrud.updateDialogOpen.value"
      v-model:deleteOpen="ProductCrud.deleteDialogOpen.value"
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { ProductsStore, SuppliersStore, AuthStore } from '@stores'

import { useProductCrud } from '@product/composables/product.crud'
import { useSearch } from '@shared/composables/useSearch.composable'
import { useRouteQueryTab } from '@shared/composables/useRouteQueryTab.composable'

import AppTable from '@shared/components/data/AppTable.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import ProductDialogs from '@product/components/ProductDialogs.vue'

import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'
import type { IProduct } from '@product/types/IProduct.types'
import { UserRole } from '@auth/types/IUser.types'
import type { PageHeaderAction } from '@shared/types/PageHeader.types'
import type { IListAction } from '@shared/types/IListAction.types'
import { addVat } from '@shared/utils/vat.util'
import { formatNumber } from '@shared/utils/formatters.util'

// Initialize routes and router
const router = useRouter()

const productsStore = ProductsStore()
const suppliersStore = SuppliersStore()
const authStore = AuthStore()

const { products, loading: isProductsLoading } = storeToRefs(productsStore)
const { suppliers } = storeToRefs(suppliersStore)
const { isAdmin } = storeToRefs(authStore)
const menuStates = ref<Record<string, boolean>>({})

// Configure table headers dynamically based on role and simplicity
const getProductHeaders = (isSimple: boolean) => {
  const headers = [
    { key: 'name', label: 'שם המוצר' },
    { key: 'supplier', label: 'ספק' },
  ]
  if (!isSimple && isAdmin.value) {
    headers.push({ key: 'price', label: 'מחיר לא כולל' }, { key: 'priceIncl', label: 'מחיר כולל' })
  }
  headers.push({ key: 'volume', label: 'נפח' })
  if (isAdmin.value) {
    headers.push({ key: 'actions', label: '' })
  }
  return headers
}

const { query, results } = useSearch(products, ['name'])

const ProductCrud = useProductCrud(productsStore)

// Menu actions — destructive actions sit in own group
const itemMenuActions = (product: IProduct): IListAction[][] => [
  [{ title: 'עדכן', icon: 'mdi-pencil', handler: () => ProductCrud.openUpdate(product) }],
  [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => ProductCrud.openDelete(product) }],
]

// Active filter tab
const activeTab = useRouteQueryTab(
  'type',
  'all',
  computed(() => [
    'all',
    ProductType.ALCOHOL,
    ProductType.SODA,
    ProductType.ENERGY_DRINK,
    ProductType.ACCOMPANYING,
    ProductType.DISPOSABLE,
    ProductType.EQUIPMENT,
  ]),
)

// Header details computed properties
const pageTitle = computed(() => 'מוצרים')

const pageDesc = computed(() => 'נהל את רשימת המוצרים והציוד שלך בקלות')

const pageBreadcrumbs = computed(() => ['בית', pageTitle.value])

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

// Computed check for equipment mode
const isEquipmentMode = computed(() => {
  return activeTab.value === ProductType.EQUIPMENT
})

// Helpers for simpler types check
const isTypeSimple = (type: ProductType) => {
  return type === ProductType.EQUIPMENT
}

// Check category products existence
const hasProductsOfCategory = computed(() => {
  const selectedType = activeTab.value
  const allowedRouteTypes = [
    ProductType.ALCOHOL,
    ProductType.SODA,
    ProductType.ENERGY_DRINK,
    ProductType.ACCOMPANYING,
    ProductType.DISPOSABLE,
    ProductType.EQUIPMENT,
  ]

  if (selectedType === 'all') {
    return products.value?.some((p) => allowedRouteTypes.includes(p.type)) || false
  } else {
    return products.value?.some((p) => p.type === selectedType) || false
  }
})

// Page action buttons config
const pageHeaderActions = computed<PageHeaderAction[]>(() => {
  const actionsList: PageHeaderAction[] = [
    {
      label: 'הוסף מוצר',
      action: () => {
        ProductCrud.createDialogOpen.value = true
      },
      icon: 'mdi-plus',
    },
  ]

  actionsList.push({
    label: 'ניהול תפריט',
    action: () => {
      const selectedType = activeTab.value
      if (selectedType === 'all') {
        router.push({ name: 'products-menu' })
      } else {
        router.push({
          name: 'products-menu',
          query: { type: selectedType },
        })
      }
    },
    icon: 'mdi-silverware-variant',
    color: 'secondary',
    disabled: !hasProductsOfCategory.value,
  })

  return actionsList
})

// Tab order list
const orderedTypes = [
  ProductType.ALCOHOL,
  ProductType.SODA,
  ProductType.ENERGY_DRINK,
  ProductType.ACCOMPANYING,
  ProductType.EQUIPMENT,
  ProductType.DISPOSABLE,
]

// Grouped products filtered by query and tabs
const filteredGroupedProducts = computed(() => {
  const selectedType = activeTab.value
  const allowedRouteTypes = [
    ProductType.ALCOHOL,
    ProductType.SODA,
    ProductType.ENERGY_DRINK,
    ProductType.ACCOMPANYING,
    ProductType.DISPOSABLE,
    ProductType.EQUIPMENT,
  ]

  return results.value.reduce(
    (acc, product) => {
      const matchTab =
        selectedType === 'all'
          ? allowedRouteTypes.includes(product.type)
          : product.type === selectedType

      if (matchTab) {
        const bucket = acc[product.type] ?? (acc[product.type] = [])
        bucket.push(product)
      }
      return acc
    },
    {} as Record<string, IProduct[]>,
  )
})

// Check if currently on the all tab
const isAllTab = computed(() => activeTab.value === 'all')

// Get supplier name by ID
const getSupplierName = (supplierId: string) => {
  if (supplierId === 'no-supplier') return 'ללא ספק'
  const supplier = suppliersStore.get(supplierId)
  return supplier ? supplier.name : 'ספק לא ידוע'
}

// Supplier grouped products config
const supplierGroupedProducts = computed(() => {
  if (isAllTab.value) return {}

  const selectedType = activeTab.value
  const productsOfType = results.value.filter((p) => p.type === selectedType)

  return productsOfType.reduce(
    (acc, product) => {
      const key = product.supplierId || 'no-supplier'
      const bucket = acc[key] ?? (acc[key] = [])
      bucket.push(product)
      return acc
    },
    {} as Record<string, IProduct[]>,
  )
})

// Sorted list of supplier IDs
const sortedSupplierIds = computed(() => {
  const keys = Object.keys(supplierGroupedProducts.value)
  return keys.sort((a, b) => {
    if (a === 'no-supplier') return 1
    if (b === 'no-supplier') return -1
    const nameA = getSupplierName(a)
    const nameB = getSupplierName(b)
    return nameA.localeCompare(nameB, 'he')
  })
})

// Helper for type simple layout checks
const isCurrentTypeSimple = computed(() => {
  if (isAllTab.value) return false
  return isTypeSimple(activeTab.value as ProductType)
})
</script>
