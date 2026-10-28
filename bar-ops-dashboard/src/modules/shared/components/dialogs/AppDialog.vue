<template>
  <v-dialog
    v-model="isOpen"
    :persistent="persistent || type === 'delete' || loading"
    transition="dialog-bottom-transition"
    :width="dialogWidth"
    max-width="calc(100vw - 32px)"
    scrim="rgba(0, 0, 0, 0.3)"
    class="app-dialog"
    @keydown.escape="handleEscape"
    @keydown.enter="handleEnter"
  >
    <template v-if="type === 'raw'">
      <slot />
    </template>
    <AppCard
      v-else
      variant="form"
      :title="title"
      class="app-dialog__card"
    >
      <div class="app-dialog__body">
        <template v-if="type === 'delete'">
          <div class="text-body-1 mb-4">
            הפעולה היא בלתי הפיכה. כדי למחוק את <strong>{{ itemName }}</strong>, החלק לאישור:
          </div>

          <!-- Slide-to-confirm: track fills red as handle is dragged -->
          <div
            ref="trackRef"
            class="slide-track"
            :class="{ 'slide-track--dragging': dragging }"
            dir="ltr"
          >
            <div class="slide-fill" :style="{ width: `${PAD + dragX + HANDLE}px` }" />

            <span class="slide-label" :class="{ 'slide-label--on-fill': progress > 0.45 }">
              למחיקה החלק ימינה
            </span>

            <div
              class="slide-handle"
              :style="{ transform: `translateX(${dragX}px)` }"
              @pointerdown="onPointerDown"
              role="slider"
              tabindex="0"
              aria-label="החלק ימינה לאישור מחיקה"
              :aria-valuemin="0"
              :aria-valuemax="100"
              :aria-valuenow="Math.round(progress * 100)"
              @keydown.right="dragX = maxX; emit('confirm')"
              @keydown.left="dragX = 0"
            >
              <v-progress-circular v-if="loading" indeterminate size="20" width="2" color="white" />
              <v-icon v-else color="white" size="20">mdi-delete</v-icon>
            </div>
          </div>
        </template>
        <template v-else>
          <div v-if="message" class="text-body-1 mb-4">{{ message }}</div>
          <slot />
        </template>
      </div>

      <template #actions>
        <slot name="actions">
          <v-spacer />
          <template v-if="type === 'info'">
            <AppButton variant="primary" :disabled="loading" @click="handleClose">
              {{ confirmText || 'סגור' }}
            </AppButton>
          </template>
          <template v-else-if="type === 'confirm' || type === 'form'">
            <AppButton variant="tertiary" :disabled="loading" @click="handleCancel" class="me-2">
              {{ cancelText || 'ביטול' }}
            </AppButton>
            <AppButton
              variant="primary"
              :loading="loading"
              @click="handleConfirm"
            >
              {{ confirmText || (type === 'form' ? 'שמור' : 'אישור') }}
            </AppButton>
          </template>
          <template v-else-if="type === 'delete'">
            <AppButton variant="tertiary" :disabled="loading" @click="handleCancel">
              {{ cancelText || 'ביטול' }}
            </AppButton>
          </template>
        </slot>
      </template>
    </AppCard>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { VDialog, VSpacer, VProgressCircular, VIcon } from 'vuetify/components';
import AppCard from '../layout/AppCard.vue';
type DialogType = 'info' | 'confirm' | 'form' | 'delete' | 'raw';
type DialogSize = 'sm' | 'md' | 'lg';

// Fixed widths so a dialog never resizes with its content; phones get the screen minus 16px each side
const DIALOG_WIDTHS: Record<DialogSize, number> = { sm: 420, md: 560, lg: 760 };

interface AppDialogProps {
  modelValue: boolean;
  type?: DialogType;
  title?: string;
  message?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  persistent?: boolean;
  // Defaults: sm for delete/confirm/info, md for forms (raw/form)
  size?: DialogSize;
}

const props = withDefaults(defineProps<AppDialogProps>(), {
  type: 'info',
  title: '',
  confirmText: '',
  cancelText: '',
  loading: false,
  persistent: false,
  itemName: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
  close: [];
}>();

const dialogWidth = computed(() => {
  const fallback: DialogSize = props.type === 'raw' || props.type === 'form' ? 'md' : 'sm';
  return DIALOG_WIDTHS[props.size ?? fallback];
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// Initialize slide variables
const HANDLE = 44;
const PAD = 4;

const trackRef = ref<HTMLElement | null>(null);
const dragX = ref(0);
const dragging = ref(false);
const maxX = ref(0);

const progress = computed(() => (maxX.value > 0 ? dragX.value / maxX.value : 0));

const onPointerMove = (e: PointerEvent) => {
  if (!dragging.value || !trackRef.value) return;
  const rect = trackRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left - PAD - HANDLE / 2;
  dragX.value = Math.max(0, Math.min(x, maxX.value));
};

const onPointerUp = () => {
  if (!dragging.value) return;
  dragging.value = false;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);

  if (dragX.value >= maxX.value - 2) {
    dragX.value = maxX.value;
    emit('confirm');
  } else {
    dragX.value = 0;
  }
};

const onPointerDown = (e: PointerEvent) => {
  if (props.loading || !trackRef.value) return;
  e.preventDefault();
  maxX.value = trackRef.value.clientWidth - HANDLE - PAD * 2;
  dragging.value = true;
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
};

// Watch loading state
watch(
  () => props.loading,
  (now, prev) => {
    if (prev && !now) {
      dragX.value = 0;
    }
  }
);

// Handle action triggers
const handleClose = () => {
  isOpen.value = false;
  emit('close');
};

const handleCancel = () => {
  isOpen.value = false;
  emit('cancel');
};

const handleConfirm = () => {
  emit('confirm');
};

// Handle key bindings
const handleEscape = () => {
  if (!props.persistent && !props.loading && props.type !== 'delete') {
    handleCancel();
  }
};

const handleEnter = () => {
  if (props.type === 'confirm' || props.type === 'form') {
    if (!props.loading) {
      handleConfirm();
    }
  }
};
</script>

<style scoped>
.app-dialog > :deep(.v-overlay__content) {
  max-height: calc(100dvh - 48px);
  margin-inline: 16px;
}

/* Every direct child must fit the overlay instead of spilling past it, otherwise
   the rounded frame slices whatever overflows on a hard straight edge */
.app-dialog > :deep(.v-overlay__content) > * {
  max-height: 100%;
  min-height: 0;
}

/* type="raw" mounts a v-card: Vuetify scrolls the whole card, so its title and
   actions slide under the edge. Pin them and scroll the text instead */
.app-dialog > :deep(.v-overlay__content) .v-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* raw dialogs land on Vuetify's rounded-lg (8px) while AppCard uses 20px;
     one radius for every dialog, whatever it wraps */
  border-radius: var(--bo-radius-lg, 20px) !important;
}

.app-dialog > :deep(.v-overlay__content) .v-card > .v-form {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.app-dialog > :deep(.v-overlay__content) .v-card-text {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.app-dialog > :deep(.v-overlay__content) .v-card-title,
.app-dialog > :deep(.v-overlay__content) .v-card-actions {
  flex: 0 0 auto;
}

/* The card owns the rounded frame, so it must fit the overlay rather than
   overflow it - otherwise the overlay clips content on a hard straight edge */
/* Fill the fixed dialog width; AppCard's own page max-width must not apply here */
.app-dialog__card.app-card {
  max-width: none;
  margin: 0;
}

.app-dialog__card {
  display: flex;
  flex-direction: column;
  max-height: 100%;
  min-height: 0;
}

/* Only the middle scrolls; title and actions stay pinned inside the radius */
.app-dialog__card :deep(.app-card__header),
.app-dialog__card :deep(.app-card__actions) {
  flex: 0 0 auto;
}

.app-dialog__card :deep(.app-card__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.app-dialog__body {
  width: 100%;
}

/* Slide to delete styles */
.slide-track {
  position: relative;
  height: 52px;
  border-radius: var(--bo-radius-loose, 32px);
  background: rgba(var(--v-theme-error, 244, 67, 54), 0.08);
  border: 1px solid rgba(var(--v-theme-error, 244, 67, 54), 0.2);
  overflow: hidden;
  user-select: none;
  touch-action: none;
}

.slide-fill {
  position: absolute;
  inset-block: 0;
  left: 0;
  border-radius: var(--bo-radius-loose, 32px);
  background: linear-gradient(90deg, rgba(var(--v-theme-error, 244, 67, 54), 0.65), rgb(var(--v-theme-error, 244, 67, 54)));
}

.slide-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: rgb(var(--v-theme-error, 244, 67, 54));
  pointer-events: none;
  transition: color var(--bo-transition-fast, 150ms) ease;
}

.slide-label--on-fill {
  color: #fff;
}

.slide-handle {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgb(var(--v-theme-error, 244, 67, 54));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  box-shadow: var(--bo-shadow-raised);
}

.slide-handle:active {
  cursor: grabbing;
}

.slide-handle,
.slide-fill {
  transition:
    transform var(--bo-transition-normal, 250ms) ease,
    width var(--bo-transition-normal, 250ms) ease;
}

.slide-track--dragging .slide-handle,
.slide-track--dragging .slide-fill {
  transition: none;
}
</style>
