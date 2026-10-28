<template>
  <AppDialog v-model="isOpen" type="raw" size="sm">
    <v-card class="pa-2 rounded-lg" width="100%">
      <!-- Header -->
      <v-card-title class="text-h6 font-weight-bold d-flex justify-space-between align-center pa-4">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-file-image-outline" size="24" color="primary" />
          <span>{{ title || 'צפייה וניהול קבלה' }}</span>
        </div>
        <AppButton icon="mdi-close" variant="text" size="small" @click="isOpen = false" />
      </v-card-title>

      <v-card-text class="d-flex flex-column ga-3 pa-4 pt-0">
        <!-- Loading Overlay for Upload/Delete -->
        <div
          v-if="loading"
          class="d-flex justify-center align-center w-100 rounded-lg pa-4 position-relative loading-overlay"
        >
          <v-progress-circular color="primary" indeterminate size="32" />
        </div>

        <template v-else>
          <!-- Image Preview -->
          <div
            v-if="receiptUrl"
            class="d-flex flex-column align-center justify-center border rounded-lg pa-2 bg-grey-lighten-5 position-relative overflow-hidden w-100 receipt-preview"
          >
            <v-img
              :src="receiptUrl"
              class="receipt-image rounded-lg cursor-zoom-in w-100"
              max-height="250"
              cover
              @click="viewerOpen = true"
            >
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular color="primary" indeterminate />
                </div>
              </template>
            </v-img>
          </div>

          <!-- Empty Placeholder Square -->
          <div v-else class="d-flex justify-center w-100 pa-2">
            <div
              class="d-flex flex-column align-center justify-center rounded-lg pa-3 bg-grey-lighten-5 text-center no-receipt-placeholder"
            >
              <v-icon icon="mdi-image-off-outline" size="28" color="medium-emphasis" class="mb-1" />
              <span class="text-caption text-medium-emphasis font-weight-medium">אין קבלה</span>
            </div>
          </div>
        </template>
      </v-card-text>

      <v-divider class="my-1" />

      <!-- Actions -->
      <v-card-actions class="d-flex flex-column ga-2 pa-4">
        <!-- File Input Trigger -->
        <AppButton
          color="primary"
          variant="flat"
          block
          size="large"
          class="rounded-lg font-weight-bold"
          prepend-icon="mdi-upload"
          :loading="loading"
          @click="triggerFileInput"
        >
          הוסף קובץ / תמונה
        </AppButton>

        <!-- Hidden File Input -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*,application/pdf"
          class="d-none"
          @change="onFileChange"
        />

        <!-- Download Button -->
        <AppButton
          v-if="receiptUrl"
          color="secondary"
          variant="outlined"
          block
          size="large"
          class="rounded-lg font-weight-bold"
          prepend-icon="mdi-download"
          @click="downloadReceipt"
        >
          הורד קבלה
        </AppButton>

        <!-- Remove Button -->
        <AppButton
          color="error"
          variant="outlined"
          block
          size="large"
          class="rounded-lg font-weight-bold"
          prepend-icon="mdi-delete-outline"
          :loading="loading"
          :disabled="!receiptUrl"
          @click="emit('remove')"
        >
          הסר קבלה
        </AppButton>
      </v-card-actions>
    </v-card>
  </AppDialog>

  <!-- Full Screen Image Viewer Modal -->
  <v-dialog
    v-model="viewerOpen"
    fullscreen
    scrim="rgba(0, 0, 0, 0.95)"
    transition="fade-transition"
  >
    <div class="position-relative d-flex justify-center align-center w-100 h-100 bg-black">
      <!-- Toolbar Actions in Fullscreen -->
      <div class="position-absolute top-0 right-0 ma-4 d-flex ga-2 viewer-toolbar">
        <AppButton
          icon="mdi-download"
          color="white"
          variant="text"
          size="large"
          title="הורד קבלה"
          @click="downloadReceipt"
        />
        <AppButton
          icon="mdi-close"
          color="white"
          variant="text"
          size="large"
          @click="viewerOpen = false"
        />
      </div>
      <!-- Fullscreen Image -->
      <v-img v-if="receiptUrl" :src="receiptUrl" max-width="100vw" max-height="100vh" />
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title?: string
  receiptUrl?: string | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'upload', payload: { file: File; base64: string }): void
  (e: 'remove'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const viewerOpen = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const file = files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = (e) => {
    const base64 = e.target?.result as string
    emit('upload', { file, base64 })
    // Reset input so same file can be reselected
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }

  reader.readAsDataURL(file)
}

const downloadReceipt = async () => {
  const receiptUrl = props.receiptUrl
  if (typeof receiptUrl !== 'string') return
  try {
    const response = await fetch(receiptUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Extract file extension safely via regex
    const match = receiptUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
    const extension = (match && match[1]) || 'png'

    // Sanitize the filename to strip any characters that could allow injection or traversal
    const safeTitle = (props.title || 'file').replace(/[^a-zA-Z0-9_\u0590-\u05FF\s-]/g, '')

    link.setAttribute('download', `receipt-${safeTitle}.${extension}`)
    link.click()
    window.URL.revokeObjectURL(url)
  } catch {
    // Fallback if fetch fails (e.g. CORS block)
    window.open(receiptUrl, '_blank')
  }
}
</script>

<style scoped>
.receipt-image {
  transition: opacity 0.2s;
}

.receipt-image:hover {
  opacity: 0.9;
}

/* Loading overlay — used when upload/delete is in progress */
.loading-overlay {
  height: 150px;
  background-color: rgba(255, 255, 255, 0.7);
}

/* Image preview container */
.receipt-preview {
  min-height: 150px;
}

/* Empty state placeholder square */
.no-receipt-placeholder {
  width: 120px;
  height: 120px;
  border: 2px dashed rgba(128, 128, 128, 0.3) !important;
}

/* Fullscreen viewer toolbar — above the v-dialog overlay (z-index 2000 default) */
.viewer-toolbar {
  z-index: 1001;
}
</style>
