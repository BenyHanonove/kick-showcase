import AppButton from './modules/shared/components/layout/AppButton.vue'
import AppListItem from './modules/shared/components/layout/AppListItem.vue'
import AppList from './modules/shared/components/layout/AppList.vue'
import AppCard from './modules/shared/components/layout/AppCard.vue'
import AppDialog from './modules/shared/components/dialogs/AppDialog.vue'
import AppInput from './modules/shared/components/input/AppInput.vue'
import AppTable from './modules/shared/components/data/AppTable.vue'
import EmptyState from './modules/shared/components/data/EmptyState.vue'
import GenericForm from './modules/shared/components/forms/GenericForm.vue'
import PageHeader from './modules/shared/components/layout/PageHeader.vue'
import GlobalLoading from './modules/shared/components/feedback/GlobalLoading.vue'
import StatusChip from './modules/shared/components/data/StatusChip.vue'
import MetricCard from './modules/shared/components/data/MetricCard.vue'
import AppLayout from './modules/shared/components/layout/AppLayout.vue'
import AppSnackbar from './modules/shared/components/feedback/AppSnackbar.vue'

import { rules } from './modules/shared/utils/rules.util'
import {
  formatPhoneNumber,
  formatNumber,
  formatCurrency,
  compactCurrency,
  formatDate,
  getWhatsAppUrl,
} from './modules/shared/utils/formatters.util'
import { addVat, removeVat } from './modules/shared/utils/vat.util'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    AppButton: typeof AppButton
    AppListItem: typeof AppListItem
    AppList: typeof AppList
    AppCard: typeof AppCard
    AppDialog: typeof AppDialog
    AppInput: typeof AppInput
    AppTable: typeof AppTable
    EmptyState: typeof EmptyState
    GenericForm: typeof GenericForm
    PageHeader: typeof PageHeader
    GlobalLoading: typeof GlobalLoading
    StatusChip: typeof StatusChip
    MetricCard: typeof MetricCard
    AppLayout: typeof AppLayout
    AppSnackbar: typeof AppSnackbar
  }

  export interface ComponentCustomProperties {
    $rules: typeof rules
    $formatPhoneNumber: typeof formatPhoneNumber
    $formatNumber: typeof formatNumber
    $formatCurrency: typeof formatCurrency
    $compactCurrency: typeof compactCurrency
    $formatDate: typeof formatDate
    $whatsAppUrl: typeof getWhatsAppUrl
    $addVat: typeof addVat
    $removeVat: typeof removeVat
    $VAT_RATE: number
    $VAT_PERCENT: number
  }
}

declare module 'vue' {
  export interface ComponentCustomProperties {
    $rules: typeof rules
    $formatPhoneNumber: typeof formatPhoneNumber
    $formatNumber: typeof formatNumber
    $formatCurrency: typeof formatCurrency
    $compactCurrency: typeof compactCurrency
    $formatDate: typeof formatDate
    $whatsAppUrl: typeof getWhatsAppUrl
    $addVat: typeof addVat
    $removeVat: typeof removeVat
    $VAT_RATE: number
    $VAT_PERCENT: number
  }
}
