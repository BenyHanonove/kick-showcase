<template>
  <v-navigation-drawer
    :model-value="isOpen"
    @update:model-value="isOpen = $event"
    class="app-drawer"
  >
    <v-list density="comfortable" nav color="primary" class="bg-transparent">
      <v-list-subheader class="text-uppercase text-medium-emphasis"> תפריט ראשי </v-list-subheader>

      <v-list-item
        v-for="item in items"
        :key="item.value"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.value"
        :to="item.to"
        rounded="lg"
      >
        <template v-if="item.count != null" v-slot:append>
          <v-chip size="x-small" variant="tonal" class="font-weight-bold">
            {{ item.count }}
          </v-chip>
        </template>
      </v-list-item>

      <v-divider class="my-2" />

      <v-list-item
        prepend-icon="mdi-logout"
        title="התנתק"
        class="text-error"
        rounded="lg"
        @click="handleLogout"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Import stores
import {
  AuthStore,
  SessionsStore,
  SalesStore,
  ClientsStore,
  EmployeesStore,
  ProductsStore,
  SuppliersStore,
  ReservationsStore,
} from '@stores'
import { EmployeeStatus } from '@employee/types/EmployeeStatus.types'
import { useAuthCrud } from '@auth/composables/auth.crud'

const auth = AuthStore()
const isOpen = defineModel<boolean>()

const { handleLogout } = useAuthCrud()

const sessions = SessionsStore()
const sales = SalesStore()
const clients = ClientsStore()
const employees = EmployeesStore()
const products = ProductsStore()
const suppliers = SuppliersStore()
const reservations = ReservationsStore()

const items = computed(() => {
  const baseItems = [
    {
      title: 'אירועים',
      value: 'sessions',
      to: '/dashboard/sessions',
      icon: 'mdi-calendar',
      count: sessions.sessions?.length,
    },
    {
      title: 'מכירות',
      value: 'sales',
      to: '/dashboard/sales',
      icon: 'mdi-sale',
      count: sales.sales?.length,
    },
    {
      title: 'לידים',
      value: 'leads',
      to: '/dashboard/leads',
      icon: 'mdi-account-clock',
      count: reservations.reservations?.length,
    },
    {
      title: 'לקוחות',
      value: 'clients',
      to: '/dashboard/clients',
      icon: 'mdi-account-tie',
      count: clients.clients?.length,
    },
    {
      title: 'עובדים',
      value: 'employees',
      to: '/dashboard/employees',
      icon: 'mdi-account-group',
      count: employees.employees?.filter((e) => e.status !== EmployeeStatus.PENDING).length,
    },
    {
      title: 'מוצרים',
      value: 'products',
      to: '/dashboard/products',
      icon: 'mdi-package-variant-closed',
      count: products.products?.length,
    },
    {
      title: 'מחסן',
      value: 'storage',
      to: '/dashboard/storage',
      icon: 'mdi-warehouse',
    },
    {
      title: 'ספקים',
      value: 'suppliers',
      to: '/dashboard/suppliers',
      icon: 'mdi-truck-delivery',
      count: suppliers.suppliers?.length,
    },
  ]

  return baseItems.filter((item) => {
    if (item.value === 'sales') return auth.isAdmin
    return true
  })
})
</script>

<style scoped>
.app-drawer {
  border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity, 0.08)) !important;
  background-color: rgba(var(--v-theme-background), 0.85) !important;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

/* Premium active state styling for sidebar links */
:deep(.v-list-item--active) {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: 700 !important;
  position: relative;
}

/* Subtle brand accent bar on the edge of the active drawer link */
:deep(.v-list-item--active)::before {
  content: '';
  position: absolute;
  top: 15%;
  height: 70%;
  width: 4px;
  background-color: rgb(var(--v-theme-primary));
  border-radius: 4px;
}

/* Align active indicator based on document reading direction (RTL vs LTR) */
:deep(.v-locale--is-rtl .v-list-item--active)::before {
  right: 0;
  left: auto;
}
:deep(.v-locale--is-ltr .v-list-item--active)::before {
  left: 0;
  right: auto;
}
</style>
