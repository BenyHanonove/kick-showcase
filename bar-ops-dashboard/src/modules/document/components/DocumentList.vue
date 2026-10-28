<template>
  <v-container class="pa-0">
    <!-- List Section Header -->
    <div class="d-flex align-center ga-2 mb-4 px-2">
      <div class="title-indicator rounded-pill bg-primary"></div>
      <h5 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">מסמכים</h5>
      <v-chip size="x-small" variant="flat" color="primary" class="font-weight-bold">
        {{ documents.length }} מסמכים
      </v-chip>
    </div>

    <!-- File explorer style grid of square tiles -->
    <v-row dense>
      <v-col
        v-for="item in documents"
        :key="item.id"
        cols="6"
        sm="4"
        md="3"
        lg="2"
      >
        <DocumentCard
          :document="item"
          @edit="(d) => emit('edit', d)"
          @delete="(d) => emit('delete', d)"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import DocumentCard from '@document/components/DocumentCard.vue'

import type { IDocument } from '@document/types/IDocument.types'

import { SessionStore } from '@stores'

const sessionStore = SessionStore()

const documents = computed(() => sessionStore.documents?.data || [])

const emit = defineEmits<{
  (e: 'edit', document: IDocument): void
  (e: 'delete', document: IDocument): void
}>()
</script>

<style scoped>
.title-indicator {
  width: 4px;
  height: 20px;
}
</style>
