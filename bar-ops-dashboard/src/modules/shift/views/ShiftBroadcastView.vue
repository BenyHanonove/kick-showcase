<template>
  <v-container class="py-6 px-4 max-width-container">
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold">שידור הודעות לאירוע</h1>
      <p class="text-subtitle-2 text-medium-emphasis mb-0">
        התבניות שנשלחות לעובדים סביב האירוע - בחר/י מה לשלוח ובדוק/י מה יקבלו
      </p>
    </div>

    <v-card class="rounded-xl border elevation-0 pa-5">
      <div class="text-subtitle-1 font-weight-bold mb-3">איזו הודעה לשלוח?</div>
      <v-radio-group v-model="selectedName" hide-details class="template-options">
        <v-radio
          v-for="(item, index) in templates"
          :key="item.name"
          :value="item.name"
          color="primary"
          :class="{ 'mt-3': index > 0 }"
        >
          <template #label>
            <div class="d-flex align-center ga-2">
              <v-icon size="20" color="primary">{{ item.icon }}</v-icon>
              <div>
                <div class="font-weight-medium">{{ item.title }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.description }}</div>
              </div>
            </div>
          </template>
        </v-radio>
      </v-radio-group>

      <v-divider class="my-5" />

      <div class="d-flex align-center justify-space-between ga-2 mb-3">
        <div class="text-subtitle-1 font-weight-bold">למי לשלוח?</div>
        <!-- Recipient count stays in view before sending -->
        <v-chip
          v-if="!isAssignmentNotice"
          size="small"
          :color="activeRecipientIds.length ? 'primary' : 'warning'"
          variant="tonal"
          prepend-icon="mdi-account-check-outline"
          class="font-weight-bold"
        >
          {{ recipientCountLabel }}
        </v-chip>
      </div>

      <!-- The assignment notice fans out server side over the session's shifts, nothing to pick -->
      <p v-if="isAssignmentNotice" class="text-body-2 text-medium-emphasis mb-0">
        לכל העובדים המשובצים במשמרות האירוע
      </p>
      <!-- Same missing-details rule as the employees table -->
      <p v-else-if="isDetailsUpdate" class="text-body-2 text-medium-emphasis mb-0">
        לעובדים המשובצים באירוע שחסרים להם פרטים
      </p>
      <EmployeeSelectChip v-else v-model="recipientIds" :exclude-ids="staffedIds" />

      <v-divider class="my-5" />

      <WhatsAppTemplateDetails :template="selectedTemplate" :values="previewValues" />

      <v-divider class="my-5" />

      <div class="d-flex align-center justify-space-between ga-3">
        <p class="text-caption text-medium-emphasis mb-0">{{ sendHint }}</p>
        <AppButton
          v-if="WHATSAPP_SERVICE_ENABLED"
          color="primary"
          variant="elevated"
          prepend-icon="mdi-send-outline"
          class="rounded-lg font-weight-bold flex-shrink-0"
          :disabled="isSendDisabled"
          :loading="isSending"
          @click="handleSend"
        >
          {{ sendLabel }}
        </AppButton>
        <v-alert
          v-else
          type="warning"
          variant="tonal"
          density="compact"
          icon="mdi-whatsapp"
          class="flex-shrink-0"
        >
          {{ WHATSAPP_UNAVAILABLE_MESSAGE }}
        </v-alert>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
// Broadcasts the session WhatsApp templates plus the details-update link to employees
import { ref, computed, onMounted } from 'vue'
import { WHATSAPP_SERVICE_ENABLED, WHATSAPP_UNAVAILABLE_MESSAGE } from '@shared/utils/whatsapp.util'
import { useRoute } from 'vue-router'
import { StatusCodes } from 'http-status-codes'
import { shiftProvider } from '@shift/providers/shift.provider'
import { employeeProvider } from '@employee/providers/employee.provider'
import { SessionsStore, SnackbarStore, EmployeesStore } from '@stores'
import WhatsAppTemplateDetails from '@employee/components/WhatsAppTemplateDetails.vue'
import EmployeeSelectChip from '@employee/components/EmployeeSelectChip.vue'
import {
  WhatsAppTemplate,
  WhatsAppTemplates,
  SessionWhatsAppTemplates,
} from '@employee/types/WhatsAppTemplate.types'
import { ShiftRegistration } from '@shift/types/ShiftRegistration.types'
import { getMissingFields } from '@employee/utils/missingFields.util'

const route = useRoute()
const snackbarStore = SnackbarStore()
const sessionsStore = SessionsStore()
const employeesStore = EmployeesStore()

const templates = [
  ...SessionWhatsAppTemplates,
  WhatsAppTemplates[WhatsAppTemplate.EMPLOYEE_DETAILS_UPDATE],
]
const selectedName = ref<WhatsAppTemplate>(WhatsAppTemplate.SHIFT_ASSIGNMENT_NOTICE)
const isSending = ref(false)

// Only the registration invite picks recipients; the assignment notice is session wide
const recipientIds = ref<string[]>([])

// Anyone with a shift on the event, whatever its registration, gets no invite
const staffedIds = ref<string[]>([])

// Employees actually staffed on the event, pending and rejected requests left out
const sessionEmployeeIds = ref<string[]>([])

const loadStaffedIds = async () => {
  const result = await shiftProvider.list({ sessionId: route.params.id as string })
  const shifts = result.success && result.data ? result.data : []
  staffedIds.value = [...new Set(shifts.map((shift) => shift.employeeId))]
  sessionEmployeeIds.value = [
    ...new Set(
      shifts
        .filter(
          (shift) =>
            shift.registration !== ShiftRegistration.PENDING &&
            shift.registration !== ShiftRegistration.REJECTED,
        )
        .map((shift) => shift.employeeId),
    ),
  ]
}

onMounted(loadStaffedIds)

const selectedTemplate = computed(() => WhatsAppTemplates[selectedName.value])
const isAssignmentNotice = computed(
  () => selectedName.value === WhatsAppTemplate.SHIFT_ASSIGNMENT_NOTICE,
)
const isDetailsUpdate = computed(
  () => selectedName.value === WhatsAppTemplate.EMPLOYEE_DETAILS_UPDATE,
)

// Event staff with at least one missing detail
const incompleteIds = computed(() =>
  sessionEmployeeIds.value.filter((id) => {
    const employee = employeesStore.get(id)
    return employee && getMissingFields(employee).length > 0
  }),
)

const activeRecipientIds = computed(() =>
  isDetailsUpdate.value ? incompleteIds.value : recipientIds.value,
)

const session = computed(() => sessionsStore.get(route.params.id as string))

// "יום שלישי, 19 באוגוסט, 20:00" - same wording the template shows
const formatDatetime = (value: string) => {
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''

  const day = date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  return `${day}, ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
}

// Fill in whatever this event already knows; the rest stays as sample values
const previewValues = computed<Record<number, string>>(() => {
  const values: Record<number, string> = {}
  const current = session.value
  // The details update only fills the employee's first name
  if (!current || isDetailsUpdate.value) return values

  if (current.name) values[2] = current.name

  // The assignment notice times each shift separately, so only the request gets the event datetime
  if (!isAssignmentNotice.value) {
    if (current.datetime) values[3] = formatDatetime(current.datetime)
    if (current.location) values[4] = current.location
  }

  return values
})

// The invite needs at least one recipient; the assignment notice picks its own
const isSendDisabled = computed(
  () => !isAssignmentNotice.value && activeRecipientIds.value.length === 0,
)

const recipientCountLabel = computed(() => {
  if (activeRecipientIds.value.length) return `${activeRecipientIds.value.length} נמענים`
  return isDetailsUpdate.value ? 'אין נמענים' : 'טרם נבחרו נמענים'
})

const sendLabel = computed(() => {
  if (isAssignmentNotice.value) return 'שלח תזמונים'
  return isDetailsUpdate.value ? 'שלח קישורי עדכון' : 'פתח הרשמה'
})

const sendHint = computed(() => {
  if (isAssignmentNotice.value) return 'נשלח לכל העובדים המשובצים במשמרות האירוע'

  if (isDetailsUpdate.value) {
    return incompleteIds.value.length === 0
      ? 'לכל העובדים המשובצים באירוע יש פרטים מלאים'
      : `נשלח קישור עדכון אישי ל-${incompleteIds.value.length} עובדים, בתוקף לשעה אחת`
  }

  return recipientIds.value.length === 0
    ? 'יש לבחור לפחות עובד אחד'
    : `נשלח קישור הרשמה אישי ל-${recipientIds.value.length} עובדים, בתוקף ל-24 שעות`
})

// Every shift needs a timing, otherwise employees get a message without an hour
const hasMissingTiming = async (sessionId: string) => {
  const result = await shiftProvider.list({ sessionId })
  const shifts = result.success && result.data ? result.data : []

  return shifts.some((shift) => !shift.timing)
}

// The API fans out across the session's shifts, so this is a single call
const sendSchedule = async () => {
  const result = await shiftProvider.notification(route.params.id as string)

  if (!result.success || !result.data) {
    snackbarStore.open(result.message || 'שליחת התזמונים נכשלה', 'error')
    return
  }

  const { total, sent, failed } = result.data

  if (!total) {
    snackbarStore.open('לא נמצאו משמרות לאירוע הזה', 'warning')
    return
  }

  if (!sent) {
    snackbarStore.open('שליחת התזמונים נכשלה', 'error')
    return
  }

  const summary = failed ? `נשלחו ${sent} תזמונים, ${failed} נכשלו` : `נשלחו ${sent} תזמונים בהצלחה`
  snackbarStore.open(summary, failed ? 'warning' : 'success')
}

// One call per employee - the API mints a token per invite, so this fans out client side
const openRegistration = async () => {
  const sessionId = route.params.id as string

  const results = await Promise.all(
    recipientIds.value.map((employeeId) => shiftProvider.openRegistration(sessionId, employeeId)),
  )

  // A refused call means no token at all; sent:false means the token exists but the
  // employee has no phone on file, or WhatsApp rejected the message
  const delivered = results.filter((result) => result.success && result.data?.sent).length
  const undelivered = results.filter((result) => result.success && !result.data?.sent).length
  // 409 = already has a shift on the event; the API sent nothing
  const skipped = results.filter((result) => result.statusCode === StatusCodes.CONFLICT).length
  const refused = results.length - delivered - undelivered - skipped

  if (delivered > 0) {
    snackbarStore.open(
      `נשלחו ${delivered} הזמנות הרשמה`,
      undelivered || refused || skipped ? 'warning' : 'success',
    )
  }

  if (skipped > 0) {
    snackbarStore.open(`${skipped} דולגו — כבר משובצים לאירוע`, 'info')
  }

  if (undelivered > 0) {
    snackbarStore.open(`${undelivered} קישורים נוצרו אך לא נשלחו בוואטסאפ`, 'warning')
  }

  if (refused > 0) {
    snackbarStore.open(`פתיחת ההרשמה נכשלה עבור ${refused} עובדים`, 'error')
  }

  // Only clear the ones that actually got a link, so a retry keeps the failures selected
  if (delivered > 0 || undelivered > 0 || skipped > 0) {
    recipientIds.value = []
  }

  // Someone may have registered or been staffed meanwhile
  await loadStaffedIds()
}

// One link per employee, the API mints a one-hour token and WhatsApps it
const sendDetailsLinks = async () => {
  const results = await Promise.all(incompleteIds.value.map((id) => employeeProvider.link(id)))

  // notified:false means the token exists but WhatsApp did not deliver it
  const delivered = results.filter((result) => result.success && result.data?.notified).length
  const undelivered = results.filter((result) => result.success && !result.data?.notified).length
  const refused = results.length - delivered - undelivered

  if (delivered > 0) {
    snackbarStore.open(
      `נשלחו ${delivered} קישורי עדכון`,
      undelivered || refused ? 'warning' : 'success',
    )
  }

  if (undelivered > 0) {
    snackbarStore.open(`${undelivered} קישורים נוצרו אך לא נשלחו בוואטסאפ`, 'warning')
  }

  if (refused > 0) {
    snackbarStore.open(`שליחת הקישור נכשלה עבור ${refused} עובדים`, 'error')
  }
}

const handleSend = async () => {
  isSending.value = true
  try {
    if (isDetailsUpdate.value) {
      await sendDetailsLinks()
      return
    }

    if (!isAssignmentNotice.value) {
      await openRegistration()
      return
    }

    if (await hasMissingTiming(route.params.id as string)) {
      snackbarStore.open('חסר תזמון לחלק מהעובדים', 'warning')
      return
    }

    await sendSchedule()
  } catch {
    const message = isAssignmentNotice.value
      ? 'שגיאה בשליחת התזמונים'
      : isDetailsUpdate.value
        ? 'שגיאה בשליחת קישורי העדכון'
        : 'שגיאה בפתיחת ההרשמה'
    snackbarStore.open(message, 'error')
  } finally {
    isSending.value = false
  }
}
</script>

<style scoped>
.max-width-container {
  max-width: 640px;
  margin: 0 auto;
}

.template-options :deep(.v-selection-control) {
  align-items: center;
}
</style>
