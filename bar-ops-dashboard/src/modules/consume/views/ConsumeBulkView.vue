<template>
  <v-container>
    <global-loading v-if="isInitialLoading" />

    <template v-else>
      <v-row class="mb-4 align-center">
        <v-col class="d-flex align-center">
          <div>
            <h2 class="text-h4 d-inline-block font-weight-bold mb-1">{{ currentMeta.title }}</h2>
            <p class="text-body-1 text-medium-emphasis mb-0">
              {{ currentMeta.desc }}
            </p>
          </div>
        </v-col>
      </v-row>

      <!-- Selection Dropdowns (Highly Mobile Friendly) -->
      <v-row class="mb-6">
        <v-col cols="12" sm="4">
          <v-select
            v-model="selectedType"
            :items="categoryOptions"
            label="קטגוריית מוצרים"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="targetField"
            :items="fieldOptions"
            label="שדה לעדכון"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="referenceField"
            :items="referenceFieldOptions"
            label="הצגת שדה נוסף לעיון"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>

      <consume-bulk
        :key="targetField + '-' + selectedType"
        :items="consumes"
        :target-field="targetField === 'leftovers' ? 'returnedToStorage' : targetField"
        :secondary-field="targetField === 'leftovers' ? 'creditedToSupplier' : undefined"
        :primary-label="targetField === 'leftovers' ? 'החזרה למחסן' : ''"
        :secondary-label="targetField === 'leftovers' ? 'החזרה לספק' : ''"
        :reference-field="activeReferenceField"
        :reference-label="referenceFieldLabel"
        :types="activeTypes"
        :session-id="isSaleContext ? saleStore.sale?.id || '' : sessionStore.session?.id || ''"
        :basic="isSaleContext"
        :loading="isBulkUpdating"
        :btn-label="currentMeta.btnLabel"
        @submit="onSubmit"
      />
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import { useConsumeCrud } from '@consume/composables/consume.crud'
import { useSessionLoader } from '@session/composables/useSessionLoader'
import { useSaleLoader } from '@sale/composables/useSaleLoader'

import ConsumeBulk from '@consume/components/ConsumeBulk.vue'
import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'

import { SessionStore, SaleStore, SnackbarStore } from '@stores'

import { consumeProvider } from '@consume/providers/consume.provider'

import type { IConsume } from '@consume/types/IConsume.types'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'

const props = defineProps<{
  initialTypes: ProductType[]
}>()

// Initialize router
const route = useRoute()
const router = useRouter()

const isSaleContext = computed(() => route.path.startsWith('/sales'))

// Active stores
const sessionStore = SessionStore()
const saleStore = SaleStore()

const currentStore = computed(() => (isSaleContext.value ? saleStore : sessionStore))

const consumes = computed(() => currentStore.value.consumes?.data || [])

// Use composables
const { isBulkUpdating, handleBulkUpdate } = useConsumeCrud()
const { loadFullSession, isInitialLoading: isSessionLoading } = useSessionLoader()
const { loadFullSale, isInitialLoading: isSaleLoading } = useSaleLoader()

const isInitialLoading = computed(() =>
  isSaleContext.value ? isSaleLoading.value : isSessionLoading.value,
)

// Load full session/sale on mount to hydrate store
onMounted(() => {
  const sessionId = route.params.id as string
  const clientId = route.params.clientId as string
  if (sessionId && clientId) {
    if (isSaleContext.value) {
      loadFullSale(sessionId, clientId)
    } else {
      loadFullSession(sessionId, clientId)
    }
  }
})

// Active field and category selections
type BulkField =
  | 'target'
  | 'order'
  | 'arrived'
  | 'fromStorage'
  | 'creditedToSupplier'
  | 'returnedToStorage'
  | 'leftovers'
const targetField = ref<BulkField>(isSaleContext.value ? 'fromStorage' : 'order')
const selectedType = ref<string>('all')

// Reference field: shows an uneditable value for context
type RealField = Exclude<BulkField, 'leftovers'>
const referenceField = ref<RealField | 'none'>('none')

// Sync targetField and selectedType from URL parameter on load/change
watch(
  () => [route.query.field, route.query.types],
  ([newField, newTypes]) => {
    if (
      newField &&
      [
        'target',
        'order',
        'arrived',
        'fromStorage',
        'creditedToSupplier',
        'returnedToStorage',
        'leftovers',
      ].includes(newField as string)
    ) {
      targetField.value = newField as BulkField
    } else {
      targetField.value = isSaleContext.value ? 'fromStorage' : 'order'
    }

    const firstType = props.initialTypes && props.initialTypes[0]
    if (
      newTypes &&
      typeof newTypes === 'string' &&
      Object.values(ProductType).includes(newTypes as ProductType)
    ) {
      selectedType.value = newTypes
    } else if (
      firstType &&
      props.initialTypes.length === 1 &&
      Object.values(ProductType).includes(firstType)
    ) {
      selectedType.value = firstType
    } else {
      selectedType.value = 'all'
    }
  },
  { immediate: true },
)

// Sync targetField and selectedType back to URL parameter
watch([targetField, selectedType], ([newField, newType]) => {
  const query: LocationQueryRaw = { ...route.query }

  if (newField !== 'order') {
    query.field = newField
  } else {
    delete query.field
  }

  if (newType !== 'all') {
    query.types = newType
  } else {
    delete query.types
  }

  router.replace({ query })
})

// Options for selectors
const categoryOptions = computed(() => [
  { title: 'הכל', value: 'all' },
  { title: ProductTypeLabels[ProductType.ALCOHOL], value: ProductType.ALCOHOL },
  { title: ProductTypeLabels[ProductType.SODA], value: ProductType.SODA },
  { title: ProductTypeLabels[ProductType.ENERGY_DRINK], value: ProductType.ENERGY_DRINK },
  { title: ProductTypeLabels[ProductType.ACCOMPANYING], value: ProductType.ACCOMPANYING },
  { title: ProductTypeLabels[ProductType.DISPOSABLE], value: ProductType.DISPOSABLE },
  { title: ProductTypeLabels[ProductType.EQUIPMENT], value: ProductType.EQUIPMENT },
])

const fieldOptions = [
  { title: 'מטרה', value: 'target' },
  { title: 'הזמנה', value: 'order' },
  { title: 'הגעה', value: 'arrived' },
  { title: 'מחסן', value: 'fromStorage' },
  { title: 'הוחזר לספק', value: 'creditedToSupplier' },
  { title: 'הוחזר למחסן', value: 'returnedToStorage' },
  { title: 'שאריות סיום', value: 'leftovers' },
]

// Fields edited for current selection (leftovers edits two)
const editedFields = computed<RealField[]>(() =>
  targetField.value === 'leftovers'
    ? ['returnedToStorage', 'creditedToSupplier']
    : [targetField.value as RealField],
)

const referenceFieldOptions = computed(() => [
  { title: 'ללא', value: 'none' },
  ...fieldOptions.filter(
    (f) => f.value !== 'leftovers' && !editedFields.value.includes(f.value as RealField),
  ),
])

// Reset reference selection if it collides with edited fields
watch(editedFields, (fields) => {
  if (referenceField.value !== 'none' && fields.includes(referenceField.value)) {
    referenceField.value = 'none'
  }
})

const activeReferenceField = computed<RealField | undefined>(() =>
  referenceField.value === 'none' ? undefined : referenceField.value,
)

const referenceFieldLabel = computed(
  () => fieldOptions.find((f) => f.value === referenceField.value)?.title || '',
)

const activeTypes = computed(() => {
  if (selectedType.value === 'all') {
    return [
      ProductType.ALCOHOL,
      ProductType.SODA,
      ProductType.ENERGY_DRINK,
      ProductType.ACCOMPANYING,
      ProductType.EQUIPMENT,
      ProductType.DISPOSABLE,
    ]
  }
  return [selectedType.value as ProductType]
})

// Metadata map for each target field
const fieldMeta = {
  target: {
    title: 'ניהול מטרה',
    desc: 'עדכן את כמויות המטרה עבור הסשן',
    btnLabel: 'עדכן מטרה',
  },
  order: {
    title: 'ניהול הזמנה',
    desc: 'עדכן את כמויות המוצרים שהוזמנו עבור הסשן',
    btnLabel: 'עדכן הזמנה',
  },
  arrived: {
    title: 'ניהול הגעת סחורה',
    desc: 'עדכן את הכמויות שהגיעו מהספקים עבור כל מוצר',
    btnLabel: 'עדכן כמויות שהגיעו',
  },
  fromStorage: {
    title: 'הוצאה מהמחסן',
    desc: 'עדכן את כמויות המוצרים שהוצאו מהמחסן עבור הסשן',
    btnLabel: 'עדכן הוצאה מהמחסן',
  },
  creditedToSupplier: {
    title: 'החזרה לספק',
    desc: 'עדכן את כמויות המוצרים שהוחזרו לספק בסיום הסשן',
    btnLabel: 'עדכן החזרות לספק',
  },
  returnedToStorage: {
    title: 'החזרה למחסן',
    desc: 'עדכן את כמויות המוצרים שהוחזרו למחסן בסיום הסשן',
    btnLabel: 'עדכן החזרות למחסן',
  },
  leftovers: {
    title: 'עדכון שאריות סיום',
    desc: 'עדכן את כמויות המוצרים שהוחזרו למחסן או לספק בסיום האירוע',
    btnLabel: 'עדכן שאריות',
  },
}

const currentMeta = computed(() => fieldMeta[targetField.value])

// Handle leftovers bulk update (both storage and supplier fields)
const handleLeftoversBulkUpdate = async (items: IConsume[]) => {
  isBulkUpdating.value = true
  try {
    const currentItems = consumes.value
    const changes = items.filter((item) => {
      const originalItem = currentItems.find((i) => i.id === item.id)
      if (!originalItem) return false
      return (
        originalItem.returnedToStorage !== item.returnedToStorage ||
        originalItem.creditedToSupplier !== item.creditedToSupplier
      )
    })

    if (changes.length === 0) {
      SnackbarStore().open('לא בוצעו שינויים', 'info')
      return 'noop'
    }

    const results = await Promise.all(
      changes.map((item) => {
        const freshItem = currentItems.find((i) => i.id === item.id) || item
        const timestamp = (freshItem as IConsume).timestamp
        const payload = {
          id: item.id,
          returnedToStorage: item.returnedToStorage,
          creditedToSupplier: item.creditedToSupplier,
          timestamp,
        }
        return consumeProvider.update(item.id, payload)
      }),
    )

    let lastMessage = ''
    let failures = 0
    for (const r of results) {
      if (r.success && r.data) {
        currentStore.value.consumes.update(r.data)
        lastMessage = r.message
      } else {
        failures++
        lastMessage = r.message
      }
    }

    SnackbarStore().open(lastMessage, failures === 0 ? 'success' : 'error')
    return failures === 0 ? 'success' : 'error'
  } finally {
    isBulkUpdating.value = false
  }
}

// Handle submission
const onSubmit = async (payload: IConsume[]) => {
  let result
  if (targetField.value === 'leftovers') {
    result = await handleLeftoversBulkUpdate(payload)
  } else {
    result = await handleBulkUpdate(payload, targetField.value)
  }
  if (result !== 'error' && result !== 'noop') {
    if (isSaleContext.value) {
      router.push({
        name: 'sale-details',
        params: {
          clientId: (route.params.clientId as string) || 'general',
          id: route.params.id as string,
        },
      })
    } else {
      router.push({
        name: 'session-details',
        params: {
          clientId: (route.params.clientId as string) || 'general',
          id: route.params.id as string,
        },
      })
    }
  }
}
</script>
