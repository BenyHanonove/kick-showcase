<template>
  <v-container class="py-6 px-4 max-width-container">
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold">תבניות הודעות לעובדים</h1>
      <p class="text-subtitle-2 text-medium-emphasis mb-0">
        ההודעות שנשלחות לעובד מחוץ להקשר של אירוע - בחר/י תבנית ובדוק/י מה יקבל
      </p>
    </div>

    <v-card class="rounded-xl border elevation-0 pa-5">
      <div class="text-subtitle-1 font-weight-bold mb-3">איזו תבנית לשלוח?</div>
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

      <div class="text-subtitle-1 font-weight-bold mb-3">למי לשלוח?</div>
      <EmployeeSelectChip v-model="recipientIds" />

      <v-divider class="my-5" />

      <WhatsAppTemplateDetails :template="selectedTemplate" />

      <v-divider class="my-5" />

      <div class="d-flex align-center justify-space-between ga-3">
        <p class="text-caption text-medium-emphasis mb-0">{{ sendHint }}</p>
        <AppButton
          v-if="WHATSAPP_SERVICE_ENABLED"
          color="primary"
          variant="elevated"
          prepend-icon="mdi-send-outline"
          class="rounded-lg font-weight-bold flex-shrink-0"
          :disabled="!recipientIds.length"
          :loading="isSending"
          @click="isConfirmOpen = true"
        >
          שלח
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

      <v-alert
        type="info"
        variant="tonal"
        density="comfortable"
        class="mt-5 rounded-lg text-body-2"
      >
        אי אפשר לשלוח טקסט חופשי בוואטסאפ - רק תבניות מאושרות. שינוי בנוסח מחייב אישור מחדש מול
        Meta.
      </v-alert>
    </v-card>

    <AppDialog
      v-model="isConfirmOpen"
      type="confirm"
      title="שליחת קישורי עדכון"
      :message="`כל עובד יקבל קישור אישי בתוקף לשעה. לשלוח ל-${recipientIds.length} עובדים?`"
      confirm-text="שלח"
      :loading="isSending"
      @confirm="handleSend"
      @cancel="isConfirmOpen = false"
    />
  </v-container>
</template>

<script setup lang="ts">
// Templates sent to an employee outside any event, with their recipients
import { ref, computed } from 'vue'
import { WHATSAPP_SERVICE_ENABLED, WHATSAPP_UNAVAILABLE_MESSAGE } from '@shared/utils/whatsapp.util'
import WhatsAppTemplateDetails from '@employee/components/WhatsAppTemplateDetails.vue'
import EmployeeSelectChip from '@employee/components/EmployeeSelectChip.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import { employeeProvider } from '@employee/providers/employee.provider'
import { SnackbarStore } from '@stores'
import {
  WhatsAppTemplate,
  WhatsAppTemplates,
  EmployeeWhatsAppTemplates,
} from '@employee/types/WhatsAppTemplate.types'

const snackbarStore = SnackbarStore()

const templates = EmployeeWhatsAppTemplates
const selectedName = ref<WhatsAppTemplate>(WhatsAppTemplate.EMPLOYEE_DETAILS_UPDATE)
const recipientIds = ref<string[]>([])
const isSending = ref(false)
const isConfirmOpen = ref(false)

const selectedTemplate = computed(() => WhatsAppTemplates[selectedName.value])

const sendHint = computed(() =>
  recipientIds.value.length
    ? `נשלח ל-${recipientIds.value.length} עובדים שנבחרו`
    : 'יש לבחור עובדים לפני השליחה',
)

// One link per employee, sequentially, to stay under Meta's rate limits
const handleSend = async () => {
  isSending.value = true

  let sent = 0

  try {
    for (const id of recipientIds.value) {
      const result = await employeeProvider.link(id)
      if (result.success) sent += 1
    }
  } finally {
    isSending.value = false
    isConfirmOpen.value = false
  }

  const failed = recipientIds.value.length - sent

  if (!sent) {
    snackbarStore.open('שליחת הקישורים נכשלה', 'error')
    return
  }

  snackbarStore.open(
    failed ? `נשלחו ${sent} קישורים, ${failed} נכשלו` : `נשלחו ${sent} קישורים בהצלחה`,
    failed ? 'warning' : 'success',
  )

  recipientIds.value = []
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
