<template>
  <v-col>
    <global-loading v-if="isInitialLoading" />

    <template v-else>
      <session-header
        v-if="sessionStore.session"
        :session="sessionStore.session"
        :is-summarizing="SessionCrud.isSummarizing.value"
        :is-employee-summarizing="ShiftCrud.isSummarizing.value"
        @summarize="onSummarize"
        @employee-summary="onEmployeeSummary"
        @update="onUpdate"
        @staffing="onStaffing"
        @close-session="onCloseSession"
      />
      <session-tabs :session-id="sessionId" />
    </template>

    <AppDialog v-model="SessionCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="SessionCrud.selectedItem.value"
        title="עריכת אירוע"
        submit-text="עדכן אירוע"
        :loading="SessionCrud.isUpdating.value"
        :fields="SessionCrud.sessionUpdateFields.value"
        :initial-values="SessionCrud.sessionUpdateInitial.value"
        show-cancel
        @submit="SessionCrud.handleUpdate"
        @cancel="SessionCrud.updateDialogOpen.value = false"
      />
    </AppDialog>

    <AppDialog v-model="SessionCrud.staffingDialogOpen.value" type="raw">
      <session-staffing
        v-if="sessionStore.session && SessionCrud.staffingDialogOpen.value"
        :session="sessionStore.session"
        :loading="SessionCrud.isStaffingUpdating.value"
        @submit="SessionCrud.handleStaffingUpdate"
      />
    </AppDialog>

    <!-- Closing Wizard Dialog -->
    <AppDialog v-model="closingWizardOpen" type="raw">
      <SessionClosingWizard
        v-if="sessionStore.session && closingWizardOpen"
        :session-id="sessionId"
        :loading="isClosingSession"
        @cancel="closingWizardOpen = false"
        @submit="handleClosingWizardSubmit"
      />
    </AppDialog>
  </v-col>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useSessionLoader } from '@session/composables/useSessionLoader'
import { useSessionCrud } from '@session/composables/session.crud'
import { useShiftCrud } from '@shift/composables/shift.crud'
import { SessionStore, SessionsStore, SnackbarStore, AuthStore } from '@stores'
import { sessionProvider } from '@session/providers/session.provider'
import { SessionStatus } from '@session/types/status.types'
import type { ISession, IUpdateSession } from '@session/types/ISession.types'

import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import SessionHeader from '@session/components/SessionHeader.vue'
import SessionTabs from '@session/components/SessionTabs.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import SessionStaffing from '@session/components/SessionStaffing.vue'
import SessionClosingWizard from '@session/components/SessionClosingWizard.vue'

const route = useRoute()
const router = useRouter()
const sessionStore = SessionStore()
const sessionsStore = SessionsStore()

const { loadFullSession, isInitialLoading } = useSessionLoader()

const sessionId = route.params.id as string
const clientId = route.params.clientId as string

onMounted(() => {
  if (sessionId && clientId) {
    loadFullSession(sessionId, clientId)
  }
})

const SessionCrud = useSessionCrud(sessionsStore)
const ShiftCrud = useShiftCrud(sessionStore.shifts)

const closingWizardOpen = ref(false)
const isClosingSession = ref(false)

const onSummarize = () => SessionCrud.handleSummary(sessionId, sessionStore.session?.status)

const onUpdate = () => {
  if (sessionStore.session) SessionCrud.openUpdate(sessionStore.session)
}

const onStaffing = () => {
  if (sessionStore.session) SessionCrud.openStaffing(sessionStore.session)
}

const onEmployeeSummary = () => ShiftCrud.handleSummary(sessionId, sessionStore.session?.name)

const onCloseSession = () => {
  closingWizardOpen.value = true
}

const handleClosingWizardSubmit = async () => {
  const authStore = AuthStore()
  if (!sessionStore.session || isClosingSession.value) return
  if (!authStore.isAdmin) {
    SnackbarStore().open('אין לך הרשאה לבצע פעולה זו', 'error')
    return
  }
  isClosingSession.value = true
  try {
    const payload: IUpdateSession = {
      id: sessionStore.session.id,
      timestamp: sessionStore.session.timestamp,
      status: SessionStatus.CLOSE
    }
    const result = await sessionProvider.update(sessionStore.session.id, payload)
    if (result.success) {
      const fresh = await sessionProvider.get(sessionStore.session.id)
      const updated = (fresh.success && fresh.data ? fresh.data : { ...sessionStore.session, ...payload }) as ISession
      sessionStore.setSession(updated)
      sessionsStore.update(updated)
      SnackbarStore().open('האירוע נסגר וננעל בהצלחה', 'success')
      closingWizardOpen.value = false
      router.push({
        name: 'session-summary',
        params: { clientId: clientId || 'general', id: sessionId },
      })
    } else {
      SnackbarStore().open(result.message || 'שגיאה בסגירת האירוע', 'error')
    }
  } catch {
    SnackbarStore().open('שגיאה בתקשורת עם השרת', 'error')
  } finally {
    isClosingSession.value = false
  }
}
</script>
