<template>
  <v-col>
    <PageHeader
      :path="[]"
      :title="pageTitle"
      :desc="pageDesc"
      :min-role="UserRole.MANAGER"
      :actions="pageHeaderActions"
    />

    <!-- Same width and side padding as the header -->
    <v-container class="py-0">
      <!-- Prices hint stands out since totals are read as pre-VAT -->
      <v-alert
        type="info"
        variant="tonal"
        density="compact"
        icon="mdi-information-outline"
        rounded="lg"
        class="mb-4 font-weight-bold"
      >
        המחירים לא כוללים מע"מ
      </v-alert>

      <!-- Filter Tabs -->
      <v-tabs
        v-if="types.length > 1"
        v-model="activeTab"
        align-tabs="start"
        color="primary"
        class="border-b mb-6"
      >
        <v-tab value="all">הכל</v-tab>
        <v-tab v-for="type in types" :key="type" :value="type">
          {{ ProductTypeLabels[type] || type }}
        </v-tab>
      </v-tabs>

      <div v-if="filteredConsumes.length > 0">
        <consume-summary :consumes="filteredConsumes" :types="activeTabTypes" />

        <v-row>
          <v-col cols="12">
            <consume-list
              :consumes="filteredConsumes"
              @edit="ConsumeCrud.openUpdate"
              @delete="ConsumeCrud.openDelete"
              @quick-update="onQuickUpdate"
              :types="activeTabTypes"
              :basic="isSaleContext"
            />
          </v-col>
        </v-row>
      </div>
    </v-container>

    <!-- Bulk form is its own v-container, so it lines up with the one above -->
    <consume-bulk
      v-if="filteredConsumes.length === 0"
      :items="filteredInitialBulkItems"
      :target-field="'target'"
      :types="activeTabTypes"
      :btn-label="'צור מטרה חדשה'"
      :loading="ConsumeCrud.isBulkCreating.value"
      :session-id="currentEntity?.id || ''"
      @submit="onBulkCreate"
    />

    <!-- Dialogs Wrapper -->
    <ConsumeDialogs
      :ConsumeCrud="ConsumeCrud"
      :sessionId="currentEntity?.id || ''"
      :showPricesAndOrder="showPricesAndOrder"
      :isAdmin="isAdmin"
      :availableProducts="availableProducts"
      v-model:createOpen="ConsumeCrud.createDialogOpen.value"
      v-model:updateOpen="ConsumeCrud.updateDialogOpen.value"
      v-model:deleteOpen="ConsumeCrud.deleteDialogOpen.value"
    />
  </v-col>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Import composables
import { useConsumeCrud } from '@consume/composables/consume.crud'
import { useRouteQueryTab } from '@shared/composables/useRouteQueryTab.composable'

// Import custom components
import ConsumeBulk from '@consume/components/ConsumeBulk.vue'
import ConsumeList from '@consume/components/ConsumeList.vue'
import ConsumeSummary from '@consume/components/ConsumeSummary.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import ConsumeDialogs from '@consume/components/ConsumeDialogs.vue'

// Import stores
import { ProductsStore, SessionStore, SaleStore, AuthStore } from '@stores'
import { storeToRefs } from 'pinia'

// Import types
import type { ConsumeQuantityField, IConsume } from '@consume/types/IConsume.types'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'
import { UserRole } from '@auth/types/IUser.types'
import type { PageHeaderAction } from '@shared/types/PageHeader.types'

// Define props
const props = defineProps<{
  loading?: boolean
  types: ProductType[]
}>()

// Active stores
const productsStore = ProductsStore()
const sessionStore = SessionStore()
const saleStore = SaleStore()
const authStore = AuthStore()

const { isAdmin } = storeToRefs(authStore)

// Router and route
const route = useRoute()
const router = useRouter()

const isSaleContext = computed(() => route.path.startsWith('/sales'))
const currentStore = computed(() => (isSaleContext.value ? saleStore : sessionStore))
const currentEntity = computed(() => (isSaleContext.value ? saleStore.sale : sessionStore.session))

// Active filter tab
const activeTab = useRouteQueryTab(
  'type',
  'all',
  computed(() => ['all', ...props.types]),
)

// Active types list filtered by tab selection
const activeTabTypes = computed<ProductType[]>(() => {
  if (activeTab.value === 'all') {
    return props.types
  }
  return [activeTab.value as ProductType]
})

const pageTitle = 'ניהול צריכה'
const pageDesc = 'תיעוד מוצרים שנצרכו בסשן זה'

const pageHeaderActions = computed<PageHeaderAction[]>(() => {
  const currentTypes = activeTabTypes.value.join(',')
  const id = route.params.id
  const clientId = route.params.clientId

  return [
    {
      label: 'הוסף צריכה',
      action: () => {
        ConsumeCrud.createDialogOpen.value = true
      },
      icon: 'mdi-plus',
    },
    {
      label: 'עדכון מהיר',
      action: () => {
        router.push({
          name: isSaleContext.value ? 'sale-consume-bulk' : 'consume-bulk',
          params: { clientId, id },
          query: { types: currentTypes },
        })
      },
      icon: 'mdi-clipboard-edit-outline',
    },
  ]
})

// Computed properties
const consumes = computed(() => {
  const all = currentStore.value.consumes?.data || []
  return all.filter((c) => {
    const product = productsStore.products?.find((p) => p.id === c.productId)
    return product && props.types.includes(product.type as ProductType)
  })
})

const filteredConsumes = computed(() => {
  return consumes.value.filter((c) => {
    if (activeTab.value === 'all') return true
    const product = productsStore.products?.find((p) => p.id === c.productId)
    return product && product.type === activeTab.value
  })
})

const initialBulkItems = computed(
  () =>
    (productsStore.products || [])
      .filter((p) => p.isBase && props.types.includes(p.type as ProductType))
      .map((p) => ({
        id: `temp-${p.id}`,
        productId: p.id,
        sessionId: currentEntity.value?.id || '',
        chargedPrice: p.price || 0,
        supplierPrice: p.price || 0,
        target: 0,
        order: 0,
        arrived: 0,
        fromStorage: 0,
        creditedToSupplier: 0,
        returnedToStorage: 0,
        product: p,
        timestamp: '',
      })) as IConsume[],
)

const filteredInitialBulkItems = computed(() => {
  return initialBulkItems.value.filter((item) => {
    if (activeTab.value === 'all') return true
    const product = productsStore.products?.find((p) => p.id === item.productId)
    return product && product.type === activeTab.value
  })
})

// Use composables
const ConsumeCrud = useConsumeCrud()

// Whether price and order fields apply (non-equipment products)
const showPricesAndOrder = computed(() =>
  activeTabTypes.value.some((type) => type !== ProductType.EQUIPMENT),
)

// Products matching active types not already consumed
const availableProducts = computed(() => {
  const existingProductIds = new Set(
    currentStore.value.consumes.data?.map((c) => c.productId) || [],
  )
  return productsStore.products?.filter(
    (p) => activeTabTypes.value.includes(p.type as ProductType) && !existingProductIds.has(p.id),
  )
})

// Persist a single quantity edited straight from a consume row's cube
const onQuickUpdate = (payload: {
  consume: IConsume
  field: ConsumeQuantityField
  value: number
}) => ConsumeCrud.handleQuickUpdate(payload.consume, payload.field, payload.value)

// Handle submission; initial-order rows only set target quantity
const onBulkCreate = (payload: IConsume[]) =>
  ConsumeCrud.handleBulkCreate(payload, currentEntity.value?.id || '', 'target')
</script>
