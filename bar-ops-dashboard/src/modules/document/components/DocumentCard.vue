<template>
  <v-card
    variant="flat"
    class="document-tile rounded-xl border pa-3 d-flex flex-column align-center justify-center text-center transition-all animate-fade-in"
  >
    <v-avatar color="primary" variant="tonal" size="48" class="rounded-lg mb-2">
      <v-icon icon="mdi-file-document-outline" size="26" />
    </v-avatar>

    <div class="text-body-2 font-weight-bold text-truncate w-100" :title="doc.name">
      {{ truncatedName }}
    </div>
    <div class="text-caption text-medium-emphasis">{{ formattedSize }}</div>

    <v-menu v-model="menuOpen" activator="parent" location="bottom" :close-on-content-click="true">
      <AppList :actions="menuActions" />
    </v-menu>
  </v-card>
</template>

<script setup lang="ts">
// Import vue APIs
import { computed, ref } from 'vue'

// Import global components
import AppList from '@shared/components/layout/AppList.vue'

// Import types
import type { IDocument } from '@document/types/IDocument.types'
import type { IListAction } from '@shared/types/IListAction.types'

// Maximum characters shown before the name is truncated with an ellipsis
const MAX_NAME_LENGTH = 18

// Reactive state
const menuOpen = ref(false)

// Define props
const props = defineProps<{
  document: IDocument
}>()

// Define emits
const emit = defineEmits<{
  (e: 'edit', document: IDocument): void
  (e: 'delete', document: IDocument): void
}>()

// Computed properties (named `doc` to avoid shadowing the global `document` object)
const doc = computed(() => props.document)

const truncatedName = computed(() => {
  const name = doc.value.name
  if (name.length <= MAX_NAME_LENGTH) return name

  const dotIndex = name.lastIndexOf('.')
  const ext = dotIndex > 0 ? name.slice(dotIndex) : ''
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name
  const keep = Math.max(MAX_NAME_LENGTH - ext.length - 3, 1)
  return `${base.slice(0, keep)}...${ext}`
})

const formattedSize = computed(() => {
  const bytes = doc.value.size
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

const downloadDocument = () => {
  if (!doc.value.url) return
  const link = window.document.createElement('a')
  link.href = doc.value.url
  link.setAttribute('download', doc.value.name)
  window.document.body.appendChild(link)
  link.click()
  link.remove()
}

// Menu actions — destructive action sits in its own group
const menuActions = computed<IListAction[][]>(() => [
  [
    { title: 'הורדה', icon: 'mdi-download', disabled: !doc.value.url, handler: downloadDocument },
    { title: 'עדכן', icon: 'mdi-pencil', handler: () => emit('edit', doc.value) },
  ],
  [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => emit('delete', doc.value) }],
])
</script>

<style scoped>
.document-tile {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  aspect-ratio: 1 / 1;
  cursor: pointer;
  user-select: none;
}

.document-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.05);
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}

.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.w-100 {
  width: 100%;
}
</style>
