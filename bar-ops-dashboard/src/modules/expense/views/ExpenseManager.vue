<template>
  <v-col>
    <!-- Empty: title + subtitle. With data: a full-width add button instead. -->
    <PageHeader
      v-if="!hasExpenses"
      :path="[]"
      title="ניהול הוצאות"
      desc="ניהול רישומי הוצאות עבור הסשן"
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
        @click="ExpenseCrud.createDialogOpen.value = true"
      >
        הוסף הוצאה
      </AppButton>
    </auth-wrapper>

    <ExpenseSummary />

    <div v-if="hasExpenses" class="mt-6">
      <ExpenseList
        @edit="ExpenseCrud.openUpdate"
        @delete="ExpenseCrud.openDelete"
        @receipt="ExpenseCrud.openReceipt"
      />
    </div>

    <empty-state v-if="!hasExpenses" icon="mdi-cash-minus" feature="הוצאות">
      <auth-wrapper :level="UserRole.MANAGER">
        <AppButton
          block
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          rounded="lg"
          class="font-weight-bold"
          @click="ExpenseCrud.createDialogOpen.value = true"
        >
          הוסף הוצאה
        </AppButton>
      </auth-wrapper>
    </empty-state>

    <!-- Dialogs Wrapper -->
    <ExpenseDialogs
      :ExpenseCrud="ExpenseCrud"
      :sessionId="sessionStore.session?.id || ''"
      v-model:createOpen="ExpenseCrud.createDialogOpen.value"
      v-model:updateOpen="ExpenseCrud.updateDialogOpen.value"
      v-model:deleteOpen="ExpenseCrud.deleteDialogOpen.value"
      v-model:receiptOpen="ExpenseCrud.receiptDialogOpen.value"
    />
  </v-col>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { SessionStore } from '@stores'

import { useExpenseCrud } from '@expense/composables/expense.crud'

import { UserRole } from '@auth/types/IUser.types'

import EmptyState from '@shared/components/data/EmptyState.vue'
import ExpenseSummary from '@expense/components/ExpenseSummary.vue'
import ExpenseList from '@expense/components/ExpenseList.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import ExpenseDialogs from '@expense/components/ExpenseDialogs.vue'

// Initialize session store
const sessionStore = SessionStore()

// Initialize CRUD operations
const ExpenseCrud = useExpenseCrud()

// Check if expenses exist
const hasExpenses = computed(() => (sessionStore.expenses?.data || []).length > 0)
</script>
