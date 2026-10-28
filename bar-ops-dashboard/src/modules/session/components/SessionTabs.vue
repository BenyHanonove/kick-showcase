<template>
  <div class="fill-height">
    <v-col>
      <v-card flat class="rounded-0 border-b">
        <v-tabs
          v-model="activeTab"
          color="primary"
          align-tabs="start"
          density="comfortable"
          selected-class="font-weight-bold"
        >
          <v-tab
            v-for="tab in sessionTabs"
            :key="tab.id"
            :value="tab.id"
            :prepend-icon="tab.icon"
            class="text-none"
          >
            {{ tab.title }}
          </v-tab>
        </v-tabs>
      </v-card>
    </v-col>

    <v-col class="pt-2">
      <v-tabs-window v-model="activeTab">
        <v-tabs-window-item v-for="tab in sessionTabs" :key="tab.id" :value="tab.id">
          <div v-if="activeTab === tab.id" class="animate-fade-in">
            <shift-manager
              v-if="tab.id === 'shifts'"
              :loading="isGlobalLoading"
              @update:loading="isGlobalLoading = $event"
            />

            <vehicle-manager
              v-else-if="tab.id === 'vehicles'"
              :loading="isGlobalLoading"
              @update:loading="isGlobalLoading = $event"
            />

            <cashier-manager
              v-else-if="tab.id === 'cashier'"
              :loading="isGlobalLoading"
              @update:loading="isGlobalLoading = $event"
            />

            <expense-manager
              v-else-if="tab.id === 'expenses'"
              :loading="isGlobalLoading"
              @update:loading="isGlobalLoading = $event"
            />

            <tips-manager
              v-else-if="tab.id === 'tips'"
              :loading="isGlobalLoading"
              @update:loading="isGlobalLoading = $event"
            />

            <envelopes-view
              v-else-if="tab.id === 'envelopes'"
              :loading="isGlobalLoading"
              @update:loading="isGlobalLoading = $event"
            />

            <missions-manager
              v-else-if="tab.id === 'missions'"
              :loading="isGlobalLoading"
              @update:loading="isGlobalLoading = $event"
            />

            <document-manager
              v-else-if="tab.id === 'documents'"
            />

            <consume-manager
              v-else-if="tab.id === 'products'"
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

            <div v-else class="pa-10 text-center">
              <v-progress-circular
                v-if="isGlobalLoading"
                indeterminate
                color="secondary"
                size="48"
              />
              <div v-else class="text-medium-emphasis">
                <v-icon size="48" class="mb-2">mdi-hammer-wrench</v-icon>
                <p>תוכן עבור {{ tab.title }} (בקרוב)</p>
              </div>
            </div>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-col>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

import { AuthStore, RoleLevel } from '@stores'

import ShiftManager from '@shift/views/ShiftManager.vue'
import EnvelopesView from '@shift/views/EnvelopesView.vue'
import CashierManager from '@cashier/views/CashierManager.vue'
import ExpenseManager from '@expense/views/ExpenseManager.vue'
import TipsManager from '@tips/views/TipsManager.vue'
import ConsumeManager from '@consume/views/ConsumeManager.vue'
import MissionsManager from '@missions/views/MissionsManager.vue'
import VehicleManager from '@vehicle/views/VehicleManager.vue'
import DocumentManager from '@document/views/DocumentManager.vue'

import type { ISessionTab } from '@session/types/ISessionTab.types'
import { UserRole } from '@auth/types/IUser.types'
import { ProductType } from '@product/types/ProductType.types'

const isGlobalLoading = ref(false)
const authStore = AuthStore()

const sessionTabs = computed<ISessionTab[]>(() => {
  const allTabs: ISessionTab[] = [
    { id: 'products', title: 'צריכה', icon: 'mdi-package-variant-closed' },
    { id: 'cashier', title: 'קופות', icon: 'mdi-cash-register' },
    { id: 'shifts', title: 'משמרות', icon: 'mdi-calendar-clock' },
    { id: 'vehicles', title: 'הסעות', icon: 'mdi-car-multiple' },
    { id: 'expenses', title: 'הוצאות', icon: 'mdi-credit-card-outline' },
    { id: 'tips', title: 'טיפים', icon: 'mdi-hand-coin-outline' },
    { id: 'missions', title: 'משימות', icon: 'mdi-clipboard-text-outline' },
    { id: 'envelopes', title: 'מעטפות', icon: 'mdi-email-outline' },
    { id: 'documents', title: 'מסמכים', icon: 'mdi-file-document-outline' },
  ]

  if (authStore.role === UserRole.ADMIN) return allTabs

  return allTabs.filter((tab) => {
    if (tab.id === 'tips' || tab.id === 'expenses' || tab.id === 'documents') return false
    if (tab.id === 'envelopes') {
      const userLevel = authStore.role ? (RoleLevel[authStore.role] || 0) : 0
      const managerLevel = RoleLevel[UserRole.MANAGER] || 0
      return userLevel >= managerLevel
    }
    return true
  })
})

const activeTab = ref(sessionTabs.value[0]?.id)
</script>
