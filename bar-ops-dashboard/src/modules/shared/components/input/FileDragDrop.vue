<template>
  <div>
    <!-- Drop Zone -->
    <div
      class="drag-drop-zone d-flex flex-column align-center justify-center pa-6 rounded-xl cursor-pointer"
      :class="{
        'drag-over': isDragOver,
      }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFilePicker"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="props.accept"
        class="d-none"
        @change="handleFileSelect"
      />

      <v-avatar color="primary" variant="tonal" size="56" class="mb-3 transition-transform icon-avatar">
        <v-icon size="28">mdi-cloud-upload-outline</v-icon>
      </v-avatar>

      <span class="text-subtitle-1 font-weight-bold text-high-emphasis text-center mb-1">
        גרור קבצים לכאן או לחץ לבחירה
      </span>
      <span class="text-caption text-medium-emphasis">
        תומך בקבצי {{ acceptLabel }} (עד {{ props.maxFiles }} קבצים)
      </span>
    </div>

    <!-- Warning alert -->
    <v-alert
      v-if="warningMessage"
      type="warning"
      variant="tonal"
      density="comfortable"
      closable
      class="mt-3 rounded-lg text-body-2 font-weight-medium"
      @click:close="warningMessage = ''"
    >
      {{ warningMessage }}
    </v-alert>

    <!-- File Queue List -->
    <div v-if="files.length > 0" class="mt-4">
      <div class="d-flex align-center justify-space-between mb-2 px-1">
        <span class="text-subtitle-2 font-weight-bold text-medium-emphasis">
          קבצים בתור ({{ files.length }} קבצים)
        </span>
        <AppButton
          variant="text"
          color="error"
          size="small"
          density="comfortable"
          prepend-icon="mdi-trash-can-outline"
          class="font-weight-bold rounded-pill"
          @click="clearAll"
        >
          נקה הכל
        </AppButton>
      </div>

      <v-card variant="flat" class="border rounded-xl">
        <v-list class="pa-1" bg-color="transparent">
          <v-list-item
            v-for="(item, index) in files"
            :key="item.file.name + '-' + index"
            class="rounded-lg mb-1 pa-2"
          >
            <template #prepend>
              <v-avatar color="secondary" variant="tonal" rounded="lg" size="36">
                <v-icon size="20" color="secondary">mdi-file-table-outline</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="text-body-2 font-weight-bold text-truncate pr-2 filename-text">
              {{ item.file.name }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption text-medium-emphasis pr-2">
              {{ formatSize(item.file.size) }}
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex align-center ga-2">
                <!-- Status icons -->
                <v-progress-circular
                  v-if="item.status === 'uploading'"
                  indeterminate
                  size="20"
                  width="2"
                  color="primary"
                />
                <v-icon
                  v-else-if="item.status === 'success'"
                  color="success"
                  size="22"
                >
                  mdi-check-circle
                </v-icon>
                <v-tooltip
                  v-else-if="item.status === 'error'"
                  :text="item.error || 'שגיאה בהעלאה'"
                  location="top"
                >
                  <template #activator="{ props: tooltipProps }">
                    <v-icon
                      v-bind="tooltipProps"
                      color="error"
                      size="22"
                    >
                      mdi-alert-circle
                    </v-icon>
                  </template>
                </v-tooltip>
                <v-icon
                  v-else
                  color="medium-emphasis"
                  size="20"
                >
                  mdi-clock-outline
                </v-icon>

                <!-- Delete button -->
                <AppButton
                  icon="mdi-close"
                  variant="text"
                  color="medium-emphasis"
                  size="small"
                  density="comfortable"
                  class="rounded-circle"
                  :disabled="item.status === 'uploading'"
                  @click="removeFile(index)"
                />
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface UploadFileItem {
  file: File
  base64: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// Props
const props = withDefaults(
  defineProps<{
    accept?: string
    acceptLabel?: string
    maxFiles?: number
  }>(),
  {
    accept: '.csv',
    acceptLabel: 'CSV',
    maxFiles: 20,
  },
)

// Binding files list to model
const files = defineModel<UploadFileItem[]>('files', { default: () => [] })

// DOM Ref
const fileInput = ref<HTMLInputElement | null>(null)

// Local state
const isDragOver = ref(false)
const warningMessage = ref('')

// Methods
const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const triggerFilePicker = () => {
  fileInput.value?.click()
}

const removeFile = (index: number) => {
  const updatedList = [...files.value]
  updatedList.splice(index, 1)
  files.value = updatedList
}

const clearAll = () => {
  files.value = []
  warningMessage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Format file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Process dropped/selected files
const processFiles = (fileList: FileList) => {
  warningMessage.value = ''
  const newFiles: File[] = []

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]
    if (file) {
      // Validate type
      const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv'
      if (!isCSV) {
        warningMessage.value = 'קובץ שגוי - תומך בקבצי CSV בלבד'
        continue
      }
      newFiles.push(file)
    }
  }

  if (newFiles.length === 0) return

  // Validate file limit
  if (files.value.length + newFiles.length > props.maxFiles) {
    warningMessage.value = `ניתן להעלות עד ${props.maxFiles} קבצים בלבד. מקבצים עודפים הוסרו.`
    newFiles.splice(props.maxFiles - files.value.length)
  }

  // Deduplicate against already-added files
  const uniqueFiles = newFiles.filter(
    (file) => !files.value.some((f) => f.file.name === file.name && f.file.size === file.size),
  )
  if (uniqueFiles.length === 0) return

  // Read files in parallel, then one atomic update to avoid races
  const readPromises = uniqueFiles.map(
    (file) =>
      new Promise<UploadFileItem>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64Content = e.target?.result as string
          const base64Data = base64Content.split(',')[1] || base64Content
          resolve({ file, base64: base64Data, status: 'pending' })
        }
        reader.readAsDataURL(file)
      }),
  )

  Promise.all(readPromises).then((newItems) => {
    files.value = [...files.value, ...newItems]
  })
}

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  if (e.dataTransfer?.files) {
    processFiles(e.dataTransfer.files)
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    processFiles(target.files)
  }
}
</script>

<style scoped>
.drag-drop-zone {
  border-width: 2px;
  border-style: dashed;
  min-height: 160px;
  outline: none;
  border-color: rgba(var(--v-border-color), 0.24);
  background-color: rgba(var(--v-theme-on-surface), 0.03);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.drag-drop-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.drag-drop-zone:hover .icon-avatar {
  transform: scale(1.08);
}

.drag-drop-zone.drag-over {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
  transform: scale(0.995);
  box-shadow: 0 0 16px rgba(var(--v-theme-primary), 0.08);
}

.hover-bg:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.transition-transform {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Constrain file name to prevent overflow in list items */
.filename-text {
  max-width: 250px;
}
</style>
