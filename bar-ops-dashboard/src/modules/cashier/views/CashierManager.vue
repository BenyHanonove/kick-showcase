<template>
  <v-col>
    <!-- Empty: show title + subtitle. With data: title is dropped for a full-width add button. -->
    <PageHeader
      v-if="!hasCashiers"
      :path="[]"
      title="ניהול קופות"
      desc="ניהול רישומי מזומן ואשראי עבור הסשן"
      :min-role="UserRole.MANAGER"
    />

    <!-- Same width as the header -->
    <v-container class="py-0">
      <auth-wrapper v-if="hasCashiers" :level="UserRole.MANAGER">
        <div class="d-flex ga-3 mb-4">
          <AppButton
            v-if="!isSelectMode"
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            rounded="lg"
            class="flex-grow-1 font-weight-bold"
            @click="CashierCrud.createDialogOpen.value = true"
          >
            הוסף קופה
          </AppButton>
          <AppButton
            :color="isSelectMode ? 'error' : 'secondary'"
            size="large"
            :prepend-icon="isSelectMode ? 'mdi-close' : 'mdi-checkbox-multiple-marked-outline'"
            rounded="lg"
            :class="isSelectMode ? 'flex-grow-1 font-weight-bold' : 'font-weight-bold'"
            @click="toggleSelectMode"
          >
            {{ isSelectMode ? 'בטל בחירה' : 'בחירת קופות' }}
          </AppButton>
        </div>
      </auth-wrapper>

      <CashierSummary />

      <!-- קופות בר -->
      <div v-if="barCashiers.length > 0" class="mb-6">
        <div class="d-flex align-center ga-2 mb-4 px-2">
          <div class="title-indicator rounded-pill bg-primary" />
          <h5 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">קופות בר</h5>
          <v-chip size="x-small" variant="flat" color="primary" class="font-weight-bold">
            {{ barCashiers.length }} קופות
          </v-chip>
        </div>

        <v-row dense>
          <v-col v-for="item in groupedAndSingleBarCashiers" :key="item.key" cols="12">
            <!-- Render Group Card -->
            <CashierGroupCard
              v-if="item.type === 'group'"
              :group-name="item.groupName"
              :cashiers="item.cashiers"
              :is-select-mode="isSelectMode"
              :selected-ids="selectedIds"
              @edit="CashierCrud.openUpdate"
              @delete="CashierCrud.openDelete"
              @receipt="CashierCrud.openReceipt"
              @select-change="handleSelectChange"
              @select-group="handleSelectGroup"
            />
            <!-- Render Single Cashier Card -->
            <CashierCard
              v-else-if="item.type === 'single'"
              :cashier="item.cashier"
              :index="item.index"
              :is-select-mode="isSelectMode"
              :is-selected="selectedIds.includes(item.cashier.id)"
              @edit="CashierCrud.openUpdate"
              @delete="CashierCrud.openDelete"
              @receipt="CashierCrud.openReceipt"
              @select-change="(val) => handleSelectChange(item.cashier.id, val)"
            />
          </v-col>
        </v-row>
      </div>

      <!-- קופות מלצרים -->
      <div v-if="tablesCashiers.length > 0" class="mb-6">
        <div class="d-flex align-center ga-2 mb-4 px-2">
          <div class="title-indicator rounded-pill bg-teal" />
          <h5 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">קופות מלצרים</h5>
          <v-chip size="x-small" variant="flat" color="teal" class="font-weight-bold">
            {{ tablesCashiers.length }} קופות
          </v-chip>
        </div>

        <v-row dense>
          <v-col v-for="item in groupedAndSingleTablesCashiers" :key="item.key" cols="12">
            <!-- Render Group Card -->
            <CashierGroupCard
              v-if="item.type === 'group'"
              :group-name="item.groupName"
              :cashiers="item.cashiers"
              :is-select-mode="isSelectMode"
              :selected-ids="selectedIds"
              @edit="CashierCrud.openUpdate"
              @delete="CashierCrud.openDelete"
              @receipt="CashierCrud.openReceipt"
              @select-change="handleSelectChange"
              @select-group="handleSelectGroup"
            />
            <!-- Render Single Cashier Card -->
            <CashierCard
              v-else-if="item.type === 'single'"
              :cashier="item.cashier"
              :index="item.index"
              :is-select-mode="isSelectMode"
              :is-selected="selectedIds.includes(item.cashier.id)"
              @edit="CashierCrud.openUpdate"
              @delete="CashierCrud.openDelete"
              @receipt="CashierCrud.openReceipt"
              @select-change="(val) => handleSelectChange(item.cashier.id, val)"
            />
          </v-col>
        </v-row>
      </div>

      <empty-state v-if="!hasCashiers" icon="mdi-cash-register" feature="קופות">
        <auth-wrapper :level="UserRole.MANAGER">
          <AppButton
            block
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            rounded="lg"
            class="font-weight-bold"
            @click="CashierCrud.createDialogOpen.value = true"
          >
            הוסף קופה
          </AppButton>
        </auth-wrapper>
      </empty-state>
    </v-container>

    <!-- Dialogs Wrapper -->
    <CashierDialogs
      :CashierCrud="CashierCrud"
      :sessionId="sessionStore.session?.id || ''"
      v-model:selectedIds="selectedIds"
      v-model:isSelectMode="isSelectMode"
      v-model:bulkDeleteOpen="bulkDeleteDialogOpen"
      v-model:groupUpdateOpen="groupDialogOpen"
      v-model:createOpen="CashierCrud.createDialogOpen.value"
      v-model:updateOpen="CashierCrud.updateDialogOpen.value"
      v-model:deleteOpen="CashierCrud.deleteDialogOpen.value"
      v-model:receiptOpen="CashierCrud.receiptDialogOpen.value"
    />

    <!-- Floating Bulk Actions Bar -->
    <v-fade-transition>
      <div
        v-if="isSelectMode && selectedIds.length > 0"
        class="position-fixed bottom-0 left-0 right-0 d-flex justify-center pa-4 pb-6 bulk-actions-bar"
      >
        <v-card
          elevation="8"
          class="d-flex align-center justify-space-between ga-4 px-4 py-3 rounded-pill bg-surface border bulk-actions-card"
        >
          <div class="d-flex align-center ga-2">
            <v-chip color="primary" variant="flat" size="small" class="font-weight-bold">
              {{ selectedIds.length }}
            </v-chip>
            <span class="text-subtitle-2 font-weight-bold text-high-emphasis">קופות נבחרו</span>
          </div>

          <div class="d-flex ga-2">
            <AppButton
              color="primary"
              variant="flat"
              prepend-icon="mdi-tag-outline"
              size="small"
              rounded="pill"
              class="font-weight-bold"
              @click="groupDialogOpen = true"
            >
              עדכן קבוצה
            </AppButton>
            <AppButton
              color="error"
              variant="flat"
              prepend-icon="mdi-delete"
              size="small"
              rounded="pill"
              class="font-weight-bold"
              @click="bulkDeleteDialogOpen = true"
            >
              מחק
            </AppButton>
            <AppButton
              variant="text"
              size="small"
              rounded="pill"
              class="font-weight-bold text-medium-emphasis"
              @click="clearSelection"
            >
              נקה
            </AppButton>
          </div>
        </v-card>
      </div>
    </v-fade-transition>
  </v-col>
</template>

<script setup lang="ts">
// Import vue APIs
import { computed, ref } from 'vue'

// Import stores
import { SessionStore } from '@stores'

// Import composables
import { useCashierCrud } from '@cashier/composables/cashier.crud'

// Import types
import { CashierLocation } from '@cashier/types/CashierLocation.types'
import { UserRole } from '@auth/types/IUser.types'
import type { ICashier } from '@cashier/types/ICashier.types'

// Import custom components
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import EmptyState from '@shared/components/data/EmptyState.vue'
import CashierSummary from '@cashier/components/CashierSummary.vue'
import CashierGroupCard from '@cashier/components/CashierGroupCard.vue'
import CashierCard from '@cashier/components/CashierCard.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import CashierDialogs from '@cashier/components/CashierDialogs.vue'

// Initialize session store
const sessionStore = SessionStore()

// Initialize CRUD operations
const CashierCrud = useCashierCrud()

// Check if cashiers exist
const hasCashiers = computed(() => (sessionStore.cashiers?.data || []).length > 0)

// Cashiers filtered by location
const barCashiers = computed(() =>
  (sessionStore.cashiers?.data || []).filter((c) => c.location === CashierLocation.BAR),
)

const tablesCashiers = computed(() =>
  (sessionStore.cashiers?.data || []).filter((c) => c.location === CashierLocation.TABLES),
)

// Helper function to group cashiers
const getGroupedAndSingle = (list: ICashier[]) => {
  const groups: Record<string, ICashier[]> = {}
  const ungrouped: ICashier[] = []

  for (const item of list) {
    if (item.group && item.group.trim()) {
      const gName = item.group.trim()
      if (!groups[gName]) {
        groups[gName] = []
      }
      groups[gName].push(item)
    } else {
      ungrouped.push(item)
    }
  }

  const result: (
    | {
        type: 'group'
        key: string
        groupName: string
        cashiers: ICashier[]
        cashier?: undefined
        index?: undefined
      }
    | {
        type: 'single'
        key: string
        cashier: ICashier
        index: number
        groupName?: undefined
        cashiers?: undefined
      }
  )[] = []

  // Add group cards
  Object.keys(groups).forEach((gName) => {
    const groupCashiers = groups[gName]
    if (groupCashiers) {
      result.push({
        type: 'group',
        key: `group-${gName}`,
        groupName: gName,
        cashiers: groupCashiers,
      })
    }
  })

  // Add single cards
  ungrouped.forEach((item, idx) => {
    result.push({
      type: 'single',
      key: `single-${item.id}`,
      cashier: item,
      index: idx,
    })
  })

  return result
}

const groupedAndSingleBarCashiers = computed(() => getGroupedAndSingle(barCashiers.value))
const groupedAndSingleTablesCashiers = computed(() => getGroupedAndSingle(tablesCashiers.value))

// Bulk Select Mode state and functions
const isSelectMode = ref(false)
const selectedIds = ref<string[]>([])
const bulkDeleteDialogOpen = ref(false)
const groupDialogOpen = ref(false)

const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value
  if (!isSelectMode.value) {
    selectedIds.value = []
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

const handleSelectChange = (id: string, isSelected: boolean) => {
  if (isSelected) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  }
}

const handleSelectGroup = (ids: string[], isSelected: boolean) => {
  ids.forEach((id) => handleSelectChange(id, isSelected))
}
</script>

<style scoped>
/* Title section indicator bar */
.title-indicator {
  width: 4px;
  height: 20px;
  flex-shrink: 0;
}

/* Floating bulk actions bar */
.bulk-actions-bar {
  z-index: 99;
}

.bulk-actions-card {
  max-width: 500px;
  width: 100%;
}
</style>
