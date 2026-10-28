<template>
  <v-card variant="flat" class="consume-card mb-2">
    <v-card-text class="py-2 px-3 py-md-3 px-md-4">
      <v-row align="center" no-gutters class="ga-3 ga-md-0">
        <!-- Section 1: Product & Supplier Info -->
        <v-col cols="12" :md="showPricesAndOrder ? 2 : 4" class="d-flex align-center ga-3">
          <InitialsAvatar
            v-if="supplier"
            :name="supplier.name"
            color="primary"
            size="36"
            class="supplier-avatar elevation-1"
          >
            <v-tooltip activator="parent" location="top">{{ supplier.name }}</v-tooltip>
          </InitialsAvatar>
          <v-avatar v-else color="grey-lighten-3" size="36">
            <v-icon color="grey-darken-1" size="18">mdi-package-variant-closed</v-icon>
          </v-avatar>

          <div class="overflow-hidden">
            <div class="text-subtitle-2 font-weight-black text-primary text-truncate">
              {{ product?.name }}
            </div>
            <div
              v-if="supplier"
              class="text-caption text-medium-emphasis text-truncate d-flex align-center mt-0.5"
            >
              <v-icon size="11" class="me-1">mdi-truck-outline</v-icon>
              {{ supplier.name }}
            </div>
          </div>
        </v-col>

        <!-- Section 2: Quantities (Amount of Items) -->
        <v-col cols="12" md="6" class="bordered-col px-md-2 px-lg-4">
          <div
            class="metrics-row d-flex align-stretch justify-space-between ga-1 ga-lg-2"
            :class="{ 'metrics-row-basic': basic }"
          >
            <template v-for="cube in visibleCubes" :key="cube.key">
              <div v-if="cube.dividerBefore" class="metric-divider" />
              <div
                class="metric-group cube"
                :class="[cube.cls, { 'cube-editable': !!cube.field }]"
                :role="cube.field ? 'button' : undefined"
                :tabindex="cube.field ? 0 : undefined"
                :aria-label="cube.field ? `${cube.label}: ${cube.value}. לחץ לעריכה` : undefined"
                @click="cube.field && startEdit(cube.field, cube.value)"
                @keydown.enter="cube.field && startEdit(cube.field, cube.value)"
              >
                <div class="metric-label">{{ cube.label }}</div>
                <input
                  v-if="cube.field && editingField === cube.field"
                  :ref="focusOnMount"
                  v-model="editValue"
                  type="number"
                  min="0"
                  inputmode="numeric"
                  class="metric-input"
                  @click.stop
                  @blur="commitEdit"
                  @keydown.enter.prevent="commitEdit"
                  @keydown.esc.prevent="cancelEdit"
                />
                <div v-else class="metric-value">{{ cube.value }}</div>
              </div>
            </template>
          </div>
        </v-col>

        <!-- Section 3: Prices & Totals (Admin only) -->
        <v-col v-if="showPricesAndOrder" cols="12" md="3" class="bordered-col px-md-2 px-lg-4">
          <auth-wrapper :level="UserRole.ADMIN">
            <div class="prices-grid" :class="profit >= 0 ? 'is-profit' : 'is-loss'">
              <!-- Header: one column per VAT variant -->
              <div class="grid-head" />
              <div class="grid-head">ללא מע״מ</div>
              <div class="grid-head">כולל מע״מ ({{ VAT_PERCENT }}%)</div>

              <template v-if="isPriceSame">
                <div class="price-label">מחיר יחידה</div>
                <div class="price-val font-weight-bold">
                  ₪{{ (consume.chargedPrice ?? 0).toFixed(2) }}
                </div>
                <div class="price-val font-weight-bold">
                  ₪{{ addVat(consume.chargedPrice ?? 0).toFixed(2) }}
                </div>

                <div class="grid-divider" />

                <div class="summary-label">סה״כ</div>
                <div class="summary-val font-weight-black text-primary">
                  ₪{{ totalCharged.toFixed(2) }}
                </div>
                <div class="summary-val font-weight-black text-primary">
                  ₪{{ addVat(totalCharged).toFixed(2) }}
                </div>
              </template>
              <template v-else>
                <div class="price-label">עלות יחידה</div>
                <div class="price-val text-medium-emphasis">
                  ₪{{ (product?.price ?? 0).toFixed(2) }}
                </div>
                <div class="price-val text-medium-emphasis">
                  ₪{{ addVat(product?.price ?? 0).toFixed(2) }}
                </div>

                <div class="price-label">מחיר לקוח</div>
                <div class="price-val text-primary font-weight-bold">
                  ₪{{ (consume.chargedPrice ?? 0).toFixed(2) }}
                </div>
                <div class="price-val text-primary font-weight-bold">
                  ₪{{ addVat(consume.chargedPrice ?? 0).toFixed(2) }}
                </div>

                <div class="grid-divider" />

                <div class="summary-label">סה״כ עלות</div>
                <div class="summary-val">₪{{ totalCost.toFixed(2) }}</div>
                <div class="summary-val">₪{{ addVat(totalCost).toFixed(2) }}</div>

                <div class="summary-label">סה״כ לקוח</div>
                <div class="summary-val font-weight-bold">₪{{ totalCharged.toFixed(2) }}</div>
                <div class="summary-val font-weight-bold">₪{{ addVat(totalCharged).toFixed(2) }}</div>

                <div class="summary-label profit-cell profit-cell--start">רווח</div>
                <div class="summary-val font-weight-black profit-cell">
                  <span dir="ltr">₪{{ profit.toFixed(2) }}</span>
                </div>
                <div class="summary-val font-weight-black profit-cell profit-cell--end">
                  <span dir="ltr">₪{{ addVat(profit).toFixed(2) }}</span>
                </div>
              </template>
            </div>
          </auth-wrapper>
        </v-col>

        <!-- Section 5: Action Menu -->
        <v-col
          cols="12"
          :md="showPricesAndOrder ? 1 : 2"
          class="d-flex align-center justify-end justify-md-center ga-1 action-col"
        >
          <v-menu transition="slide-y-transition" rounded="lg">
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
            <AppList :actions="menuActions" />
          </v-menu>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import AuthWrapper from '@auth/components/AuthWrapper.vue'
import InitialsAvatar from '@shared/components/layout/InitialsAvatar.vue'

import { ProductsStore, SuppliersStore } from '@stores'

import { getConsumedQuantity } from '@consume/composables/consume.calc'

import { addVat, VAT_PERCENT } from '@shared/utils/vat.util'

import type { ConsumeQuantityField, IConsume } from '@consume/types/IConsume.types'
import { ProductType } from '@product/types/ProductType.types'
import { UserRole } from '@auth/types/IUser.types'
import type { IListAction } from '@shared/types/IListAction.types'

const emit = defineEmits(['edit', 'delete', 'quick-update'])

const props = withDefaults(defineProps<{ consume: IConsume; basic?: boolean }>(), {
  basic: false,
})

// Menu actions — destructive actions sit in their own group
const menuActions: IListAction[][] = [
  [{ title: 'ערוך', icon: 'mdi-pencil-outline', handler: () => emit('edit', props.consume) }],
  [{ title: 'מחק', icon: 'mdi-delete-outline', color: 'error', handler: () => emit('delete', props.consume) }],
]

// Consumed = received minus units returned to supplier or storage
const consumedQuantity = computed(() => getConsumedQuantity(props.consume))

// Fetch related product details
const product = computed(() => ProductsStore().get(props.consume.productId))

// Visible only when product type isn't equipment
const showPricesAndOrder = computed(() => {
  const type = product.value?.type
  return !!type && type !== ProductType.EQUIPMENT
})

// Fetch related supplier details
const supplier = computed(() =>
  product.value ? SuppliersStore().get(product.value.supplierId) : null,
)

// Calculate total charged to the client
const totalCharged = computed(() => consumedQuantity.value * (props.consume.chargedPrice ?? 0))

// Calculate total cost of consumed items
const totalCost = computed(() => consumedQuantity.value * (props.consume.supplierPrice ?? 0))

// Calculate total profit
const profit = computed(() => totalCharged.value - totalCost.value)

// Check if supplier price and charged price are identical
const isPriceSame = computed(() => {
  const cost = props.consume.supplierPrice ?? 0
  const charged = props.consume.chargedPrice ?? 0
  return Math.abs(cost - charged) < 0.01
})

// One metric cube. A cube without `field` is derived and therefore read-only.
// `group` drives the dividers: one is drawn wherever two visible cubes differ.
interface IMetricCube {
  key: string
  label: string
  value: number
  cls: string
  group: number
  show: boolean
  field?: ConsumeQuantityField
}

const cubes = computed<IMetricCube[]>(() => [
  {
    key: 'target',
    label: 'יעד',
    value: props.consume.target ?? 0,
    cls: 'cube-target',
    group: 1,
    show: !props.basic,
    field: 'target',
  },
  {
    key: 'order',
    label: 'הוזמן ספק',
    value: props.consume.order ?? 0,
    cls: 'cube-order',
    group: 2,
    show: true,
    field: 'order',
  },
  {
    key: 'arrived',
    label: 'הגיע מספק',
    value: props.consume.arrived ?? 0,
    cls: 'cube-received',
    group: 3,
    show: showPricesAndOrder.value,
    field: 'arrived',
  },
  {
    key: 'fromStorage',
    label: 'הגיע ממחסן',
    value: props.consume.fromStorage ?? 0,
    cls: 'cube-storage',
    group: 3,
    show: true,
    field: 'fromStorage',
  },
  {
    key: 'leftover',
    label: 'נשאר',
    value: (props.consume.creditedToSupplier ?? 0) + (props.consume.returnedToStorage ?? 0),
    cls: 'cube-leftover',
    group: 4,
    show: !props.basic,
  },
  {
    key: 'creditedToSupplier',
    label: 'חזר לספק',
    value: props.consume.creditedToSupplier ?? 0,
    cls: 'cube-credited',
    group: 4,
    show: true,
    field: 'creditedToSupplier',
  },
  {
    key: 'returnedToStorage',
    label: 'חזר למחסן',
    value: props.consume.returnedToStorage ?? 0,
    cls: 'cube-returned',
    group: 4,
    show: true,
    field: 'returnedToStorage',
  },
  {
    key: 'consumed',
    label: 'נצרך',
    value: consumedQuantity.value,
    cls: 'cube-consumed',
    group: 5,
    show: true,
  },
])

const visibleCubes = computed(() => {
  const shown = cubes.value.filter((cube) => cube.show)
  return shown.map((cube, i) => ({
    ...cube,
    dividerBefore: i > 0 && cube.group !== shown[i - 1]?.group,
  }))
})

// Inline quantity editing — only one cube per row is ever in edit mode
const editingField = ref<ConsumeQuantityField | null>(null)
// Vue casts v-model on a type="number" input, so this holds a number once edited
const editValue = ref<string | number>('')

const startEdit = (field: ConsumeQuantityField, current: number) => {
  editingField.value = field
  editValue.value = current
}

const cancelEdit = () => {
  editingField.value = null
  editValue.value = ''
}

// Fires on both Enter and blur; the first call clears the state so the second is a no-op.
// Read the typed value before cancelEdit() blanks it.
const commitEdit = () => {
  const field = editingField.value
  if (!field) return

  const raw = typeof editValue.value === 'string' ? editValue.value.trim() : editValue.value
  cancelEdit()

  // A cleared or unparseable input (type="number" yields '') leaves the value untouched
  if (raw === '') return

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) return
  if (parsed === (props.consume[field] ?? 0)) return

  emit('quick-update', { consume: props.consume, field, value: parsed })
}

// Select the input's contents as soon as it appears, so typing replaces the old count
const focusOnMount = (el: unknown) => {
  const input = el as HTMLInputElement | null
  if (!input) return
  input.focus()
  input.select()
}
</script>

<style scoped>
.consume-card {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
  transition: all 0.15s ease-in-out;
  border-inline-start: 4px solid rgb(var(--v-theme-primary)) !important;
  border-radius: 8px !important;
}

.consume-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.25) !important;
  background-color: rgba(var(--v-theme-on-surface), 0.01) !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
}

.supplier-avatar {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-secondary)) 100%
  ) !important;
}

/* Column Dividers (Desktop only) */
@media (min-width: 960px) {
  .bordered-col {
    border-inline-start: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
  }
}

.metric-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-bottom: 2px;
  text-align: center;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.metric-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.85);
  text-align: center;
  white-space: nowrap;
}

/* Vertical divider between cube groups */
.metric-divider {
  width: 1px;
  align-self: stretch;
  background: rgba(var(--v-theme-on-surface), 0.12);
  flex: 0 0 auto;
}

/* Metric cubes — uniform height (align-stretch), one theme color per cube */
.metric-group.cube {
  background: rgba(var(--cube-color), 0.08);
  border: 1px solid rgba(var(--cube-color), 0.15);
  border-radius: 6px;
  padding: 4px 8px;
}
.metric-group.cube .metric-label,
.metric-group.cube .metric-value {
  color: rgb(var(--cube-color));
}

/* Editable cubes invite a click; derived ones (נשאר, נצרך) stay inert */
.cube-editable {
  cursor: pointer;
  transition:
    background-color 0.12s ease-in-out,
    border-color 0.12s ease-in-out;
}

.cube-editable:hover {
  background: rgba(var(--cube-color), 0.18);
  border-color: rgba(var(--cube-color), 0.4);
}

.cube-editable:focus-visible {
  outline: 2px solid rgb(var(--cube-color));
  outline-offset: 1px;
}

/* Inline editor — sized to match .metric-value so the cube doesn't jump */
.metric-input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: inherit;
  text-align: center;
  color: rgb(var(--cube-color));
  -moz-appearance: textfield;
  appearance: textfield;
}

.metric-input::-webkit-outer-spin-button,
.metric-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.cube-target {
  --cube-color: var(--v-theme-on-surface);
}
.cube-order {
  --cube-color: var(--v-theme-info);
}
.cube-received {
  --cube-color: var(--v-theme-primary);
}
.cube-storage {
  --cube-color: var(--v-theme-success);
}
.cube-leftover {
  --cube-color: var(--v-theme-info);
}
.cube-credited {
  --cube-color: var(--v-theme-warning);
}
.cube-returned {
  --cube-color: var(--v-theme-error);
}
.cube-consumed {
  --cube-color: var(--v-theme-secondary);
}
.cube-consumed .metric-value {
  font-size: 1.05rem;
  font-weight: 900;
}

@media (max-width: 959px) {
  .action-col {
    padding-top: 8px;
    border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.06);
  }

  /* Wrap metric cubes into a readable two-row grid on mobile */
  .metrics-row {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px !important;
  }

  /* Dividers only make sense in the single-line desktop layout */
  .metrics-row .metric-divider {
    display: none;
  }

  /* Basic mode has fewer cubes — use a 3-column grid instead of 4 */
  .metrics-row.metrics-row-basic {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 960px) and (max-width: 1279px) {
  .metric-group.cube {
    padding: 4px 4px;
  }

  .metric-label {
    font-size: 0.62rem;
  }
}

/* Prices & Summary Grid — label | net | incl. VAT.
   Zero column-gap keeps the profit band unbroken; cells pad instead. */
.prices-grid {
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  align-content: center;
  row-gap: 4px;
  column-gap: 0;
  height: 100%;
}

.grid-head {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.45);
  text-align: end;
  padding-inline-start: 8px;
  white-space: nowrap;
  line-height: 1.2;
}

.price-label,
.summary-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.45);
  white-space: nowrap;
  align-self: center;
}

.price-val,
.summary-val {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.85);
  text-align: end;
  padding-inline-start: 8px;
  white-space: nowrap;
  align-self: center;
}

/* Full-width rule between unit prices and totals */
.grid-divider {
  grid-column: 1 / -1;
  height: 1px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  margin-block: 2px;
}

/* Profit band — spans all three columns via one background per cell */
.profit-cell {
  padding-block: 2px;
}
.profit-cell--start {
  padding-inline-start: 4px;
  border-start-start-radius: 4px;
  border-end-start-radius: 4px;
}
.profit-cell--end {
  padding-inline-end: 4px;
  border-start-end-radius: 4px;
  border-end-end-radius: 4px;
}

.is-profit .profit-cell {
  background: rgba(var(--v-theme-success), 0.08);
  color: rgb(var(--v-theme-success)) !important;
  font-weight: 700;
}

.is-loss .profit-cell {
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error)) !important;
  font-weight: 700;
}
</style>
