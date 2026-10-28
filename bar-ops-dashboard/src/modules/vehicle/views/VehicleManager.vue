<template>
  <v-col>
    <!-- Empty: title + subtitle. With data: a full-width add button instead. -->
    <PageHeader
      v-if="vehicles.length === 0"
      :path="[]"
      title="ניהול הסעות"
      desc="ניהול רשימת רכבי ההסעות, נהגים ונוסעים לאירוע הנוכחי"
      :min-role="UserRole.MANAGER"
    />

    <auth-wrapper v-else :level="UserRole.MANAGER">
      <AppButton
        block
        color="primary"
        size="large"
        prepend-icon="mdi-plus"
        rounded="lg"
        class="mb-4 font-weight-bold"
        @click="vehicleCrud.createDialogOpen.value = true"
      >
        הוסף רכב
      </AppButton>
    </auth-wrapper>

    <VehicleSummary v-if="vehicles.length > 0" />

    <v-container v-if="vehicles.length === 0" class="px-0">
      <EmptyState icon="mdi-car-multiple" feature="הסעות">
        <auth-wrapper :level="UserRole.MANAGER">
          <AppButton
            block
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            rounded="lg"
            class="font-weight-bold"
            @click="vehicleCrud.createDialogOpen.value = true"
          >
            הוסף רכב
          </AppButton>
        </auth-wrapper>
      </EmptyState>
    </v-container>

    <template v-else>
      <v-container class="px-0">
        <v-row dense>
          <v-col v-for="vehicle in vehicles" :key="vehicle.id" cols="12">
            <vehicle-card
              :vehicle="vehicle"
              @edit="vehicleCrud.openUpdate(vehicle)"
              @delete="vehicleCrud.openDelete(vehicle)"
            />
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- Dialogs Wrapper -->
    <VehicleDialogs
      :vehicleCrud="vehicleCrud"
      :sessionId="sessionStore.session?.id || ''"
      v-model:createOpen="vehicleCrud.createDialogOpen.value"
      v-model:updateOpen="vehicleCrud.updateDialogOpen.value"
      v-model:deleteOpen="vehicleCrud.deleteDialogOpen.value"
    />
  </v-col>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Import stores
import { SessionStore } from '@stores'

// Import composables
import { useVehicleCrud } from '@vehicle/composables/vehicle.crud'

// Import custom components
import EmptyState from '@shared/components/data/EmptyState.vue'
import VehicleCard from '@vehicle/components/VehicleCard.vue'
import VehicleSummary from '@vehicle/components/VehicleSummary.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import VehicleDialogs from '@vehicle/components/VehicleDialogs.vue'

// Import types
import { UserRole } from '@auth/types/IUser.types'

const sessionStore = SessionStore()

const vehicles = computed(() => sessionStore.vehicles?.data || [])

// Initialize CRUD helper
const vehicleCrud = useVehicleCrud(sessionStore.vehicles)
</script>

<style scoped></style>
