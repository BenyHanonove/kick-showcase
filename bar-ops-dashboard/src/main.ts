import App from './App.vue'

import { createApp } from 'vue'

import router from '@router'

import { pinia } from '@stores'

import { vuetify } from '@plugins'

// Imports the Material Design Icons (MDI) styles and global css
import('@mdi/font/css/materialdesignicons.css')
import 'vuetify/styles'
import '@assets/styles/tokens.css'
import '@assets/styles/global.css'

import AppButton from '@shared/components/layout/AppButton.vue'
import AppListItem from '@shared/components/layout/AppListItem.vue'
import AppList from '@shared/components/layout/AppList.vue'
import AppCard from '@shared/components/layout/AppCard.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import AppInput from '@shared/components/input/AppInput.vue'
import AppTable from '@shared/components/data/AppTable.vue'
import EmptyState from '@shared/components/data/EmptyState.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'
import StatusChip from '@shared/components/data/StatusChip.vue'
import MetricCard from '@shared/components/data/MetricCard.vue'
import AppLayout from '@shared/components/layout/AppLayout.vue'
import AppSnackbar from '@shared/components/feedback/AppSnackbar.vue'

import { rules } from '@shared/utils/rules.util'
import {
  formatPhoneNumber,
  formatNumber,
  formatCurrency,
  compactCurrency,
  formatDate,
  getWhatsAppUrl,
} from '@shared/utils/formatters.util'
import { addVat, removeVat, VAT_RATE, VAT_PERCENT } from '@shared/utils/vat.util'

// Silent session restore from the backend's httpOnly refresh cookie
import { rehydrateSession } from '@auth/composables/session.bootstrap'

// --- Stale build recovery ---------------------------------------------------
// After a deploy, hashed JS chunk filenames change and index.html is rewritten
// to reference the new ones. A browser (notably Safari in a normal, non-private
// window) can serve a cached index.html that still points at old chunk URLs
// which now 404, leaving a blank page that "won't open". When a chunk fails to
// load, force a single fresh reload so the newest index.html + chunks load.
// The sessionStorage guard prevents an infinite reload loop.
const STALE_RELOAD_KEY = 'stale-build-reloaded'

export const recoverFromStaleBuild = () => {
  if (sessionStorage.getItem(STALE_RELOAD_KEY)) return
  try {
    sessionStorage.setItem(STALE_RELOAD_KEY, '1')
  } catch {
    // sessionStorage may be unavailable; still attempt one reload below.
  }
  window.location.reload()
}

// Vite fires this when a lazily-imported chunk (e.g. a route view) fails to load
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  recoverFromStaleBuild()
})

// Create a new Vue application instance with the root component
const app = createApp(App)

// Router is registered after rehydration below
app.use(pinia)
app.use(vuetify)

// Register components globally
app.component('AppButton', AppButton)
app.component('AppListItem', AppListItem)
app.component('AppList', AppList)
app.component('AppCard', AppCard)
app.component('AppDialog', AppDialog)
app.component('AppInput', AppInput)
app.component('AppTable', AppTable)
app.component('EmptyState', EmptyState)
app.component('GenericForm', GenericForm)
app.component('PageHeader', PageHeader)
app.component('GlobalLoading', GlobalLoading)
app.component('StatusChip', StatusChip)
app.component('MetricCard', MetricCard)
app.component('AppLayout', AppLayout)
app.component('AppSnackbar', AppSnackbar)

// Bind global utilities/constants
app.config.globalProperties.$rules = rules
app.config.globalProperties.$formatPhoneNumber = formatPhoneNumber
app.config.globalProperties.$formatNumber = formatNumber
app.config.globalProperties.$formatCurrency = formatCurrency
app.config.globalProperties.$compactCurrency = compactCurrency
app.config.globalProperties.$formatDate = formatDate
app.config.globalProperties.$whatsAppUrl = getWhatsAppUrl
app.config.globalProperties.$addVat = addVat
app.config.globalProperties.$removeVat = removeVat
app.config.globalProperties.$VAT_RATE = VAT_RATE
app.config.globalProperties.$VAT_PERCENT = VAT_PERCENT

// Restore session before the router's first navigation guard runs
rehydrateSession().finally(async () => {
  app.use(router)
  await router.isReady()
  app.mount('#app')

  // Smoothly dismiss startup splash screen
  const splash = document.getElementById('app-splash')
  if (splash) {
    splash.classList.add('app-splash-fade')
    setTimeout(() => splash.remove(), 450)
  }

  // App booted successfully — allow a future deploy to trigger recovery again
  try {
    sessionStorage.removeItem(STALE_RELOAD_KEY)
  } catch {
    // ignore: sessionStorage unavailable
  }
})
