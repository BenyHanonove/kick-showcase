<template>
  <v-card class="closing-wizard-card rounded-xl overflow-hidden elevation-24">
    <!-- Header -->
    <v-card-title class="pa-5 bg-primary text-white d-flex align-center justify-space-between">
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-lock-reset" size="30" />
        <span class="text-h5 font-weight-black">סגירת אירוע ונעילה</span>
      </div>
      <AppButton icon="mdi-close" variant="text" color="white" @click="emit('cancel')" />
    </v-card-title>

    <!-- Stepper indicator -->
    <div
      class="stepper-indicator d-flex align-center justify-center pa-3 bg-surface-variant border-b"
    >
      <template v-for="(step, idx) in steps" :key="step.number">
        <v-avatar
          size="36"
          :color="
            currentStep > step.number
              ? 'success'
              : currentStep === step.number
                ? 'primary'
                : 'grey-lighten-1'
          "
          class="text-white"
        >
          <v-icon :icon="currentStep > step.number ? 'mdi-check' : step.icon" size="20" />
        </v-avatar>
        <v-divider v-if="idx < steps.length - 1" class="step-divider mx-2" />
      </template>
    </div>

    <!-- Step Content -->
    <v-card-text class="pa-5 min-height-content">
      <!-- Step 1: Consumption Loss Check -->
      <div v-if="currentStep === 1" class="step-content">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">בקרת הפסדי צריכה</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">מוצרים שנצרכו במחיר נמוך מעלות המוצר.</p>

        <AppApprovalGate
          v-if="lossyConsumes.length > 0"
          v-model="lossAcknowledged"
          severity="warning"
          :message="`נמצאו ${lossyConsumes.length} מוצרים שנמכרו בהפסד כולל של ₪${totalLoss.toFixed(2)}`"
          checkbox-label="אני מאשר שראיתי את ההפסדים ומאשר להמשיך"
        >
          <v-list class="border rounded-lg pa-0 overflow-hidden mb-4">
            <v-list-item
              v-for="entry in lossyConsumes"
              :key="entry.consume.id"
              class="border-b"
              prepend-icon="mdi-trending-down"
            >
              <div class="text-body-2 font-weight-bold">{{ entry.product.name }}</div>
              <template #append>
                <div class="text-end">
                  <div class="text-caption text-medium-emphasis">
                    ₪{{ (entry.consume.supplierPrice ?? 0).toFixed(2) }} → ₪{{
                      (entry.consume.chargedPrice ?? 0).toFixed(2)
                    }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    כולל מע״מ: ₪{{ addVat(entry.consume.supplierPrice ?? 0).toFixed(2) }} → ₪{{
                      addVat(entry.consume.chargedPrice ?? 0).toFixed(2)
                    }}
                  </div>
                  <v-chip color="error" size="x-small" class="font-weight-bold">
                    <span dir="ltr"
                      >-₪{{ entry.loss.toFixed(2) }} · -₪{{ addVat(entry.loss).toFixed(2) }}</span
                    >
                  </v-chip>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </AppApprovalGate>

        <v-card
          v-else
          variant="outlined"
          class="rounded-lg pa-4 d-flex align-center justify-space-between mb-4"
        >
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-check-circle" color="success" />
            <span class="text-body-2 font-weight-bold">לא נמצאו הפסדי צריכה</span>
          </div>
          <v-chip color="success" size="small" variant="flat" class="font-weight-bold">תקין</v-chip>
        </v-card>
      </div>

      <!-- Step 2: Cashier Verification -->
      <div v-if="currentStep === 2" class="step-content">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">אימות קופה</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          ודא שהסכומים המדווחים תואמים לפני שממשיכים.
        </p>

        <v-row dense class="mb-4">
          <v-col cols="6" sm="3">
            <v-card variant="flat" class="metric-card border pa-3 rounded-lg text-center">
              <div class="text-caption text-medium-emphasis">מזומן</div>
              <div class="text-h6 font-weight-bold text-primary mt-1">
                ₪{{ cashierTotals.cash.toFixed(2) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card variant="flat" class="metric-card border pa-3 rounded-lg text-center">
              <div class="text-caption text-medium-emphasis">אשראי</div>
              <div class="text-h6 font-weight-bold text-primary mt-1">
                ₪{{ cashierTotals.credit.toFixed(2) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card variant="flat" class="metric-card border pa-3 rounded-lg text-center">
              <div class="text-caption text-medium-emphasis">טיפ אשראי</div>
              <div class="text-h6 font-weight-bold text-primary mt-1">
                ₪{{ cashierTotals.creditTip.toFixed(2) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card variant="flat" class="metric-card border pa-3 rounded-lg text-center">
              <div class="text-caption text-medium-emphasis">סה"כ</div>
              <div class="text-h6 font-weight-bold text-primary mt-1">
                ₪{{ cashierTotals.total.toFixed(2) }}
              </div>
            </v-card>
          </v-col>
        </v-row>

        <AppApprovalGate
          v-model="cashierVerified"
          severity="warning"
          message="אנא ודא שהסכומים לעיל תואמים את דוח הקופה לפני שממשיכים."
          checkbox-label="אני מאשר שהסכומים תואמים"
        />
      </div>

      <!-- Step 3: Shift Verification -->
      <div v-if="currentStep === 3" class="step-content">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">אימות משמרות עובדים</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          ודא שכל העובדים ביצעו יציאה ושכל המשמרות מאושרות על ידי מנהל.
        </p>

        <!-- Timing constraint: every shift must have a start time set -->
        <div v-if="shiftsMissingTiming.length > 0" class="mb-4">
          <v-alert
            type="error"
            variant="tonal"
            class="rounded-xl mb-3 text-caption"
            density="comfortable"
          >
            לא ניתן לסגור את האירוע כאשר ישנן משמרות ללא זמן משמרת מוגדר.
          </v-alert>

          <v-expansion-panels variant="accordion" class="border rounded-lg overflow-hidden">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-caption font-weight-bold text-medium-emphasis">
                משמרות ללא זמן מוגדר ({{ shiftsMissingTiming.length }})
              </v-expansion-panel-title>
              <v-expansion-panel-text class="pa-0">
                <v-list class="pa-0 scroll-list">
                  <v-list-item
                    v-for="shift in shiftsMissingTiming"
                    :key="shift.id"
                    class="border-t"
                    prepend-icon="mdi-clock-alert-outline"
                  >
                    <div class="text-body-2 font-weight-bold">
                      {{ getEmployeeName(shift.employeeId) }}
                    </div>
                    <template #append>
                      <v-chip color="error" size="x-small" class="font-weight-bold">
                        חסר זמן
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

        <div v-if="unapprovedShifts.length > 0" class="mb-4">
          <v-alert
            type="error"
            variant="tonal"
            class="rounded-xl mb-3 text-caption"
            density="comfortable"
          >
            לא ניתן לסגור את האירוע כאשר ישנן משמרות שטרם אושרו.
          </v-alert>

          <v-expansion-panels variant="accordion" class="border rounded-lg overflow-hidden">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-caption font-weight-bold text-medium-emphasis">
                משמרות ממתינות לאישור ({{ unapprovedShifts.length }})
              </v-expansion-panel-title>
              <v-expansion-panel-text class="pa-0">
                <v-list class="pa-0 scroll-list">
                  <v-list-item
                    v-for="shift in unapprovedShifts"
                    :key="shift.id"
                    class="border-t"
                    prepend-icon="mdi-account-alert"
                  >
                    <div class="text-body-2 font-weight-bold">
                      {{ getEmployeeName(shift.employeeId) }}
                    </div>
                    <template #append>
                      <v-chip color="error" size="x-small" class="font-weight-bold">
                        ממתין לאישור
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <AppButton
            block
            variant="flat"
            color="success"
            rounded="lg"
            prepend-icon="mdi-check-all"
            class="mt-3"
            :loading="approvingShifts"
            @click="handleApproveAllShifts"
          >
            אשר את כל המשמרות ({{ unapprovedShifts.length }})
          </AppButton>
        </div>

        <v-card
          v-if="unapprovedShifts.length === 0 && shiftsMissingTiming.length === 0"
          variant="outlined"
          class="rounded-lg pa-4 d-flex align-center justify-space-between mb-4"
        >
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-check-circle" color="success" />
            <span class="text-body-2 font-weight-bold">כל משמרות העובדים אושרו ומתוזמנות</span>
          </div>
          <v-chip color="success" size="small" variant="flat" class="font-weight-bold">תקין</v-chip>
        </v-card>
      </div>

      <!-- Step 4: Expense Audit -->
      <div v-if="currentStep === 4" class="step-content">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">בקרת הוצאות קופה</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          אנא ודא שכל הוצאות הקופה נרשמו כראוי, מקובצות לפי גורם משלם.
        </p>

        <AppApprovalGate
          v-model="expenseConfirmed"
          severity="warning"
          :message="`סך ההוצאות: ₪${totalExpenses.toFixed(2)} (${expensesCount} הוצאות)`"
          checkbox-label="אני מאשר כי כל הוצאות הקופה נרשמו ותקינות"
        >
          <v-expansion-panels
            v-if="expensesByPaidBy.length > 0"
            variant="accordion"
            class="border rounded-lg overflow-hidden mb-4"
          >
            <v-expansion-panel v-for="group in expensesByPaidBy" :key="group.paidBy ?? 'other'">
              <v-expansion-panel-title>
                <v-icon icon="mdi-cash-minus" size="20" class="me-2" />
                <span class="text-body-2 font-weight-bold">{{ getPaidByLabel(group.paidBy) }}</span>
                <v-spacer />
                <div class="text-end me-2">
                  <div class="text-caption text-medium-emphasis">{{ group.count }} הוצאות</div>
                  <v-chip color="primary" size="x-small" class="font-weight-bold">
                    ₪{{ group.total.toFixed(2) }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text class="pa-0">
                <v-list class="pa-0">
                  <v-list-item
                    v-for="expense in group.expenses"
                    :key="expense.id"
                    class="border-t"
                    density="compact"
                  >
                    <div class="text-body-2">{{ expense.name }}</div>
                    <template #append>
                      <span class="text-body-2 font-weight-bold">
                        ₪{{ (expense.amount || 0).toFixed(2) }}
                      </span>
                    </template>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </AppApprovalGate>
      </div>

      <!-- Step 5: Hourly & Tips Payout Check -->
      <div v-if="currentStep === 5" class="step-content">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">בדיקת שכר שעתי וטיפים</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          סיכום טיפים לפי אזור, ואימות שלכל עובד הוגדר תעריף שעתי.
        </p>

        <v-list class="border rounded-lg pa-0 overflow-hidden mb-3">
          <v-list-item
            v-for="areaTotal in tipsByArea"
            :key="areaTotal.area"
            class="border-b"
            prepend-icon="mdi-hand-coin-outline"
          >
            <div class="text-body-2 font-weight-bold">{{ ServiceAreaLabels[areaTotal.area] }}</div>
            <template #append>
              <div class="text-end text-caption text-medium-emphasis">
                מזומן ₪{{ areaTotal.cashTip.toFixed(0) }} · אשראי ₪{{
                  areaTotal.creditTip.toFixed(0)
                }}
                · ראנר ₪{{ areaTotal.runnerFeed.toFixed(0) }}
              </div>
            </template>
          </v-list-item>
        </v-list>
        <div class="d-flex justify-space-between align-center text-body-2 font-weight-bold mb-4">
          <span>סך הטיפים</span>
          <span>₪{{ tipsGrandTotal.toFixed(0) }}</span>
        </div>

        <div v-if="shiftsMissingHourly.length > 0" class="mb-4">
          <v-alert
            type="error"
            variant="tonal"
            class="rounded-xl mb-3 text-caption"
            density="comfortable"
          >
            לא ניתן לסגור את האירוע כאשר ישנם עובדים ללא תעריף שעתי מוגדר.
          </v-alert>

          <v-expansion-panels variant="accordion" class="border rounded-lg overflow-hidden">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-caption font-weight-bold text-medium-emphasis">
                עובדים ללא תעריף שעתי ({{ shiftsMissingHourly.length }})
              </v-expansion-panel-title>
              <v-expansion-panel-text class="pa-0">
                <v-list class="pa-0 scroll-list">
                  <v-list-item
                    v-for="shift in shiftsMissingHourly"
                    :key="shift.id"
                    class="border-t"
                    prepend-icon="mdi-account-alert"
                  >
                    <div class="text-body-2 font-weight-bold">
                      {{ getEmployeeName(shift.employeeId) }}
                    </div>
                    <template #append>
                      <v-chip color="error" size="x-small" class="font-weight-bold">
                        חסר תעריף
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

        <v-card
          v-else
          variant="outlined"
          class="rounded-lg pa-4 d-flex align-center justify-space-between mb-4"
        >
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-check-circle" color="success" />
            <span class="text-body-2 font-weight-bold">לכל העובדים הוגדר תעריף שעתי</span>
          </div>
          <v-chip color="success" size="small" variant="flat" class="font-weight-bold">תקין</v-chip>
        </v-card>
      </div>

      <!-- Step 6: Mission Completion Check -->
      <div v-if="currentStep === 6" class="step-content">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">בדיקת השלמת משימות</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          ודא שכל המשימות המשויכות לאירוע זה הושלמו.
        </p>

        <div v-if="incompleteMissions.length > 0" class="mb-4">
          <v-alert
            type="error"
            variant="tonal"
            class="rounded-xl mb-3 text-caption"
            density="comfortable"
          >
            לא ניתן לסגור את האירוע כאשר ישנן משימות שטרם הושלמו.
          </v-alert>

          <div class="text-caption font-weight-bold text-medium-emphasis mb-2">משימות פתוחות:</div>
          <v-list class="border rounded-lg pa-0 overflow-hidden">
            <v-list-item
              v-for="mission in incompleteMissions"
              :key="mission.id"
              class="border-b"
              prepend-icon="mdi-clipboard-text-outline"
            >
              <div class="text-body-2 font-weight-bold">{{ mission.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ mission.desc }}</div>
              <template #append>
                <v-chip
                  :color="getMissionStatusMeta(mission.status).color"
                  size="x-small"
                  class="font-weight-bold"
                >
                  {{ getMissionStatusMeta(mission.status).label }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <v-card
          v-else
          variant="outlined"
          class="rounded-lg pa-4 d-flex align-center justify-space-between mb-4"
        >
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-check-circle" color="success" />
            <span class="text-body-2 font-weight-bold">כל המשימות הושלמו</span>
          </div>
          <v-chip color="success" size="small" variant="flat" class="font-weight-bold">תקין</v-chip>
        </v-card>
      </div>
    </v-card-text>

    <!-- Actions Footer -->
    <v-card-actions class="pa-4 bg-surface-light border-t d-flex justify-space-between ga-2">
      <AppButton
        v-if="currentStep > 1"
        prepend-icon="mdi-arrow-right"
        variant="tonal"
        color="secondary"
        rounded="lg"
        @click="currentStep--"
      >
        חזור
      </AppButton>
      <div v-else />

      <AppButton
        v-if="currentStep < 6"
        append-icon="mdi-arrow-left"
        variant="flat"
        color="primary"
        rounded="lg"
        :disabled="isNextDisabled"
        @click="currentStep++"
      >
        המשך
      </AppButton>

      <AppButton
        v-else
        prepend-icon="mdi-lock"
        variant="flat"
        color="success"
        rounded="lg"
        :disabled="isNextDisabled"
        :loading="props.loading"
        @click="handleCloseSession"
      >
        נעל אירוע
      </AppButton>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { SessionStore, EmployeesStore, ProductsStore, SnackbarStore } from '@stores'
import { shiftProvider } from '@shift/providers/shift.provider'
import AppApprovalGate from '@shared/components/input/AppApprovalGate.vue'
import { MissionStatus, getMissionStatusMeta } from '@missions/types/status.types'
import { ExpensePaidBy, ExpensePaidByLabels } from '@expense/types/PaidBy.types'
import { ServiceArea, ServiceAreaLabels } from '@tips/types/ServiceArea.types'
import { getConsumedQuantity } from '@consume/composables/consume.calc'
import { addVat } from '@shared/utils/vat.util'

import type { IConsume } from '@consume/types/IConsume.types'
import type { IProduct } from '@product/types/IProduct.types'
import type { IExpense } from '@expense/types/IExpense.types'

const props = defineProps<{
  sessionId: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit'): void
}>()

const sessionStore = SessionStore()
const employeesStore = EmployeesStore()
const productsStore = ProductsStore()

// Persist current step per-session in localStorage for 24h
const STEP_STORAGE_TTL_MS = 24 * 60 * 60 * 1000
const stepStorageKey = `session-closer-step:${props.sessionId}`
const MAX_STEP = 6

const loadSavedStep = (): number => {
  try {
    const raw = localStorage.getItem(stepStorageKey)
    if (!raw) return 1
    const parsed = JSON.parse(raw) as { step?: number; expiresAt?: number }
    if (
      typeof parsed.step === 'number' &&
      parsed.step >= 1 &&
      parsed.step <= MAX_STEP &&
      typeof parsed.expiresAt === 'number' &&
      parsed.expiresAt > Date.now()
    ) {
      return parsed.step
    }
    localStorage.removeItem(stepStorageKey)
  } catch {
    // Ignore malformed/unavailable storage and fall back to step 1.
  }
  return 1
}

const currentStep = ref(loadSavedStep())

watch(currentStep, (step) => {
  try {
    localStorage.setItem(
      stepStorageKey,
      JSON.stringify({ step, expiresAt: Date.now() + STEP_STORAGE_TTL_MS }),
    )
  } catch {
    // Persistence is best-effort; storage may be unavailable
  }
})

const steps = [
  { number: 1, icon: 'mdi-trending-down' }, // Consumption Loss Check
  { number: 2, icon: 'mdi-cash-register' }, // Cashier Verification
  { number: 3, icon: 'mdi-calendar-clock' }, // Shift Verification
  { number: 4, icon: 'mdi-cash-minus' }, // Expense Audit
  { number: 5, icon: 'mdi-cash-clock' }, // Hourly & Tips Payout Check
  { number: 6, icon: 'mdi-clipboard-text-outline' }, // Mission Completion Check
]

// Step 1 State (products consumed below cost)
const lossAcknowledged = ref(false)
const sessionConsumes = computed(() => {
  return sessionStore.consumes?.data || []
})

interface ILossyConsumeEntry {
  consume: IConsume
  product: IProduct
  loss: number
}

const isLossyEntry = (entry: ILossyConsumeEntry | null): entry is ILossyConsumeEntry =>
  entry !== null

const lossyConsumes = computed<ILossyConsumeEntry[]>(() => {
  return sessionConsumes.value
    .map((c): ILossyConsumeEntry | null => {
      const product = productsStore.get(c.productId)
      const supplierPrice = c.supplierPrice ?? 0
      if (!product || c.chargedPrice == null || c.chargedPrice >= supplierPrice) return null
      const quantity = getConsumedQuantity(c)
      if (isNaN(quantity) || quantity <= 0) return null
      const loss = (supplierPrice - c.chargedPrice) * quantity
      if (isNaN(loss) || loss <= 0) return null
      return { consume: c, product, loss }
    })
    .filter(isLossyEntry)
})

const totalLoss = computed(() => {
  return lossyConsumes.value.reduce((sum, entry) => sum + entry.loss, 0)
})

// Step 2 State (cashier totals verification)
const cashierVerified = ref(false)
const sessionCashiers = computed(() => {
  return sessionStore.cashiers?.data || []
})

const cashierTotals = computed(() => {
  const rawCash = sessionCashiers.value.reduce((sum, c) => sum + (c.cash || 0), 0)
  const credit = sessionCashiers.value.reduce((sum, c) => sum + (c.credit || 0), 0)
  const creditTip = sessionCashiers.value.reduce((sum, c) => sum + (c.creditTip || 0), 0)
  const cash = rawCash - creditTip
  return { cash, credit, creditTip, total: cash + credit + creditTip }
})

// Step 3 State (Filter shifts associated with this session)
const sessionShifts = computed(() => {
  return sessionStore.registeredShifts
})

const unapprovedShifts = computed(() => {
  return sessionShifts.value.filter((s) => !s.approved)
})

// Missing timing: empty, whitespace, or unparseable date
const shiftsMissingTiming = computed(() => {
  return sessionShifts.value.filter((s) => {
    if (!s.timing || String(s.timing).trim() === '') return true
    return isNaN(new Date(s.timing).getTime())
  })
})

const approvingShifts = ref(false)
const handleApproveAllShifts = async () => {
  approvingShifts.value = true
  const results = await Promise.all(
    unapprovedShifts.value.map((shift) =>
      shiftProvider.update(shift.id, {
        id: shift.id,
        timestamp: shift.timestamp,
        approved: true,
      }),
    ),
  )
  let failures = 0
  for (const r of results) {
    if (r.success && r.data) {
      sessionStore.shifts.update(r.data)
    } else {
      failures++
    }
  }
  approvingShifts.value = false
  SnackbarStore().open(
    failures === 0 ? 'כל המשמרות אושרו בהצלחה' : `אישור נכשל עבור ${failures} משמרות`,
    failures === 0 ? 'success' : 'error',
  )
}

const getEmployeeName = (id: string) => {
  const emp = employeesStore.get(id)
  return emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע'
}

// Step 4 State (Expense Audit — grouped by paidBy)
const expenseConfirmed = ref(false)
const sessionExpenses = computed(() => {
  return sessionStore.expenses?.data || []
})

const totalExpenses = computed(() => {
  return sessionExpenses.value.reduce((sum, exp) => sum + (exp.amount || 0), 0)
})

const expensesCount = computed(() => sessionExpenses.value.length)

interface IExpenseGroup {
  paidBy: ExpensePaidBy | null
  total: number
  count: number
  expenses: IExpense[]
}

const expensesByPaidBy = computed<IExpenseGroup[]>(() => {
  const groups = new Map<string, IExpenseGroup>()
  for (const exp of sessionExpenses.value) {
    const key = exp.paidBy ?? 'other'
    const existing = groups.get(key)
    if (existing) {
      existing.total += exp.amount || 0
      existing.count += 1
      existing.expenses.push(exp)
    } else {
      groups.set(key, {
        paidBy: exp.paidBy ?? null,
        total: exp.amount || 0,
        count: 1,
        expenses: [exp],
      })
    }
  }
  return Array.from(groups.values())
})

const getPaidByLabel = (paidBy: ExpensePaidBy | null) =>
  paidBy ? ExpensePaidByLabels[paidBy] : 'לא שויך'

// Step 5 State (Hourly & Tips Payout Check)
const sessionTips = computed(() => {
  return sessionStore.tips?.data || []
})

interface IAreaTipTotal {
  area: ServiceArea
  cashTip: number
  creditTip: number
  runnerFeed: number
  total: number
}

const tipsByArea = computed<IAreaTipTotal[]>(() => {
  return Object.values(ServiceArea).map((area) => {
    const areaTips = sessionTips.value.filter((t) => t.area === area)
    const cashTip = areaTips.reduce((sum, t) => sum + (t.cashTip || 0), 0)
    const creditTip = areaTips.reduce((sum, t) => sum + (t.creditTip || 0), 0)
    const runnerFeed = areaTips.reduce((sum, t) => sum + (t.runnerFeed || 0), 0)
    return { area, cashTip, creditTip, runnerFeed, total: cashTip + creditTip }
  })
})

const tipsGrandTotal = computed(() => {
  return sessionTips.value.reduce((sum, t) => sum + (t.cashTip || 0) + (t.creditTip || 0), 0)
})

const shiftsMissingHourly = computed(() => {
  return sessionShifts.value.filter((s) => s.hourly == null || isNaN(Number(s.hourly)) || Number(s.hourly) < 0)
})

// Step 6 State (Filter missions associated with this session)
const sessionMissions = computed(() => {
  return sessionStore.missions?.data || []
})

const incompleteMissions = computed(() => {
  return sessionMissions.value.filter((m) => m.status !== MissionStatus.COMPLETED)
})

// Navigation logic
const isNextDisabled = computed(() => {
  if (currentStep.value === 1) {
    return lossyConsumes.value.length > 0 && !lossAcknowledged.value
  }
  if (currentStep.value === 2) {
    return !cashierVerified.value
  }
  if (currentStep.value === 3) {
    return unapprovedShifts.value.length > 0 || shiftsMissingTiming.value.length > 0
  }
  if (currentStep.value === 4) {
    return !expenseConfirmed.value
  }
  if (currentStep.value === 5) {
    return shiftsMissingHourly.value.length > 0
  }
  if (currentStep.value === 6) {
    return incompleteMissions.value.length > 0
  }
  return false
})

const handleCloseSession = () => {
  emit('submit')
}
</script>

<style scoped>
.closing-wizard-card {
  width: min(560px, calc(100vw - 32px));
  /* Cap to the viewport (dvh accounts for mobile browser chrome) and lay the
     card out as a column so only the body scrolls. */
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
}

/* Header, stepper and footer stay fixed; the body absorbs the scrolling. */
.closing-wizard-card > .v-card-title,
.closing-wizard-card > .stepper-indicator,
.closing-wizard-card > .v-card-actions {
  flex: 0 0 auto;
}

.min-height-content {
  min-height: 280px;
  flex: 1 1 auto;
  overflow-y: auto;
}

.step-divider {
  max-width: 32px;
}

.metric-card {
  background: var(--v-theme-surface);
}

/* Cap the pending/missing lists so a long roster scrolls instead of overflowing */
.scroll-list {
  max-height: 220px;
  overflow-y: auto;
}
</style>
