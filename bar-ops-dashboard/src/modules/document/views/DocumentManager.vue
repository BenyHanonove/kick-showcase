<template>
  <v-col>
    <!-- Empty: title + subtitle. With data: a full-width add button instead. -->
    <PageHeader
      v-if="!hasDocuments"
      :path="[]"
      title="ניהול מסמכים"
      desc="ניהול מסמכים מצורפים עבור הסשן"
      :min-role="UserRole.ADMIN"
    />

    <auth-wrapper v-else :level="UserRole.ADMIN">
      <AppButton
        block
        color="primary"
        size="large"
        prepend-icon="mdi-plus"
        rounded="lg"
        class="mb-4 font-weight-bold"
        @click="DocumentCrud.createDialogOpen.value = true"
      >
        העלה מסמך
      </AppButton>
    </auth-wrapper>

    <div v-if="hasDocuments" class="mt-6">
      <DocumentList @edit="DocumentCrud.openUpdate" @delete="DocumentCrud.openDelete" />
    </div>

    <empty-state v-if="!hasDocuments" icon="mdi-file-document-outline" feature="מסמכים">
      <auth-wrapper :level="UserRole.ADMIN">
        <AppButton
          block
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          rounded="lg"
          class="font-weight-bold"
          @click="DocumentCrud.createDialogOpen.value = true"
        >
          העלה מסמך
        </AppButton>
      </auth-wrapper>
    </empty-state>

    <!-- Dialogs Wrapper -->
    <DocumentDialogs
      :DocumentCrud="DocumentCrud"
      :sessionId="sessionStore.session?.id || ''"
      v-model:createOpen="DocumentCrud.createDialogOpen.value"
      v-model:updateOpen="DocumentCrud.updateDialogOpen.value"
      v-model:deleteOpen="DocumentCrud.deleteDialogOpen.value"
    />
  </v-col>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { SessionStore } from '@stores'

import { useDocumentCrud } from '@document/composables/document.crud'

import { UserRole } from '@auth/types/IUser.types'

import EmptyState from '@shared/components/data/EmptyState.vue'
import DocumentList from '@document/components/DocumentList.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import AppButton from '@shared/components/layout/AppButton.vue'
import DocumentDialogs from '@document/components/DocumentDialogs.vue'

// Initialize session store
const sessionStore = SessionStore()

// Initialize CRUD operations
const DocumentCrud = useDocumentCrud()

// Check if documents exist
const hasDocuments = computed(() => (sessionStore.documents?.data || []).length > 0)
</script>
