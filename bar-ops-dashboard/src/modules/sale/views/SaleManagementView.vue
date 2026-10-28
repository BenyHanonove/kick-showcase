<template>
  <v-container>
    <global-loading v-if="isInitialLoading" />

    <template v-else>
      <sale-header
        v-if="saleStore.sale"
        :sale="saleStore.sale"
        :is-summarizing="SaleCrud.isSummarizing.value"
        @summarize="onSummarize"
        @update="onUpdate"
      />

      <v-divider class="my-6" />

      <sale-summary />

      <!-- Consumes/Products Inventory Section -->
      <consume-manager
        :types="[
          ProductType.ALCOHOL,
          ProductType.SODA,
          ProductType.ENERGY_DRINK,
          ProductType.ACCOMPANYING,
          ProductType.EQUIPMENT,
          ProductType.DISPOSABLE,
        ]"
        :loading="isGlobalLoading"
        @update:loading="isGlobalLoading = $event"
      />
    </template>

    <AppDialog v-model="SaleCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="SaleCrud.selectedItem.value"
        title="עריכת מכירה"
        submit-text="עדכן מכירה"
        :loading="SaleCrud.isUpdating.value"
        :fields="SaleCrud.saleFields.value"
        :initial-values="SaleCrud.saleUpdateInitial.value"
        show-cancel
        @submit="SaleCrud.handleUpdate"
        @cancel="SaleCrud.updateDialogOpen.value = false"
      />
    </AppDialog>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useSaleLoader } from '@sale/composables/useSaleLoader'
import { useSaleCrud } from '@sale/composables/sale.crud'

import { SaleStore, SalesStore } from '@stores'

import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import SaleHeader from '@sale/components/SaleHeader.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import SaleSummary from '@sale/components/SaleSummary.vue'
import ConsumeManager from '@consume/views/ConsumeManager.vue'

import { ProductType } from '@product/types/ProductType.types'

const route = useRoute()
const saleStore = SaleStore()
const salesStore = SalesStore()

const { loadFullSale, isInitialLoading } = useSaleLoader()

const saleId = route.params.id as string
const clientId = route.params.clientId as string

const isGlobalLoading = ref(false)

onMounted(() => {
  if (saleId && clientId) {
    loadFullSale(saleId, clientId)
  }
})

const SaleCrud = useSaleCrud(salesStore)

const onSummarize = () => SaleCrud.handleSummary(saleId)

const onUpdate = () => {
  if (saleStore.sale) SaleCrud.openUpdate(saleStore.sale)
}
</script>
