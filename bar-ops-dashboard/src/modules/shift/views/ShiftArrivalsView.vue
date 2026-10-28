<template>
  <v-col>
    <PageHeader :path="[]" title="לוח הגעות" :desc="headerDesc" :min-role="UserRole.MANAGER">
      <template #actions>
        <AppButton
          variant="tonal"
          color="primary"
          size="large"
          rounded="lg"
          prepend-icon="mdi-arrow-right"
          class="font-weight-bold"
          @click="goBack"
        >
          חזרה לאירוע
        </AppButton>
      </template>
    </PageHeader>

    <v-container v-if="arrivalGroups.length === 0 && missingTiming.length === 0">
      <EmptyState icon="mdi-timeline-clock-outline" feature="משמרות" />
    </v-container>

    <v-container v-else class="py-0">
      <!-- Zoom toolbar -->
      <div v-if="arrivalGroups.length > 0" class="d-flex align-center ga-2 mb-3">
        <AppButton
          variant="tonal"
          color="primary"
          icon="mdi-magnify-minus-outline"
          aria-label="הקטן זום"
          :disabled="pxPerHour <= ZOOM_MIN"
          @click="zoomBy(1 / ZOOM_STEP)"
        />
        <AppButton
          variant="tonal"
          color="primary"
          icon="mdi-magnify-plus-outline"
          aria-label="הגדל זום"
          :disabled="pxPerHour >= ZOOM_MAX"
          @click="zoomBy(ZOOM_STEP)"
        />
        <span class="text-caption text-medium-emphasis d-none d-sm-inline">
          אפשר גם לצבוט במסך או Ctrl + גלגלת
        </span>
        <v-spacer />
        <AppButton
          v-if="nowTop !== null"
          variant="text"
          color="error"
          rounded="lg"
          prepend-icon="mdi-clock-outline"
          class="font-weight-bold"
          @click="scrollToTop(nowTop)"
        >
          עכשיו
        </AppButton>
      </div>

      <!-- Day grid: pinch / ctrl+wheel zoom, native vertical scroll -->
      <v-sheet
        v-if="arrivalGroups.length > 0"
        ref="scrollSheet"
        rounded="xl"
        class="border overflow-y-auto position-relative mb-4"
        :style="{ height: 'calc(100dvh - 240px)', minHeight: '360px', touchAction: 'pan-y' }"
        @wheel="onWheel"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div class="position-relative" :style="{ height: `${gridHeight}px` }">
          <!-- Hour labels + lines -->
          <template v-for="mark in hourMarks" :key="mark.ms">
            <div
              class="position-absolute text-caption text-medium-emphasis text-center"
              :style="{ top: `${mark.top - 9}px`, insetInlineStart: 0, width: `${GUTTER}px` }"
            >
              <div class="font-weight-bold">{{ mark.label }}</div>
              <div v-if="mark.dateLabel" class="text-primary">{{ mark.dateLabel }}</div>
            </div>
            <v-divider
              class="position-absolute"
              :style="{ top: `${mark.top}px`, insetInlineStart: `${GUTTER}px`, insetInlineEnd: 0 }"
            />
          </template>
          <v-divider
            v-for="top in halfHourTops"
            :key="`half-${top}`"
            class="position-absolute border-dashed opacity-40"
            :style="{ top: `${top}px`, insetInlineStart: `${GUTTER}px`, insetInlineEnd: 0 }"
          />

          <!-- Arrival blocks -->
          <div
            ref="blocksArea"
            class="position-absolute"
            :style="{ top: 0, bottom: 0, insetInlineStart: `${GUTTER + 4}px`, insetInlineEnd: '8px' }"
          >
            <v-card
              v-for="block in blocks"
              :key="block.group.key"
              :color="blockColor(block.group)"
              variant="flat"
              rounded="lg"
              class="position-absolute overflow-hidden px-2 py-1"
              :style="{
                top: `${block.top}px`,
                height: `${block.height}px`,
                width: `calc(${100 / block.cols}% - 2px)`,
                insetInlineStart: `${(100 / block.cols) * block.col}%`,
              }"
              :aria-label="`${block.group.time}: ${block.group.people.length} מגיעים`"
              @click="openGroup(block.group)"
            >
              <div class="d-flex align-center ga-1 text-body-2 font-weight-bold text-no-wrap">
                <span>{{ block.group.time }}</span>
                <span class="opacity-80">· {{ block.group.people.length }} מגיעים</span>
                <!-- Zoomed out: names inline, cut at the block edge -->
                <span
                  v-if="block.shownPeople.length === 0"
                  class="font-weight-regular opacity-80 text-truncate"
                >
                  — {{ block.group.people.map((p) => p.fullName).join(', ') }}
                </span>
              </div>
              <div class="d-flex flex-wrap">
                <div
                  v-for="person in block.shownPeople"
                  :key="person.shiftId"
                  class="d-flex align-center ga-2 pe-2"
                  :style="{ height: '24px', width: `${100 / block.nameCols}%` }"
                >
                  <v-icon
                    icon="mdi-circle"
                    size="10"
                    :color="ShiftRoleColors[person.role]"
                    class="bg-white rounded-circle flex-shrink-0"
                  />
                  <span class="text-body-2 text-truncate">{{ person.fullName }}</span>
                </div>
                <div
                  v-if="block.hiddenCount > 0 && block.shownPeople.length > 0"
                  class="d-flex align-center text-caption font-weight-bold opacity-80"
                  :style="{ height: '24px' }"
                >
                  +{{ block.hiddenCount }} נוספים
                </div>
              </div>
            </v-card>
          </div>

          <!-- Now line -->
          <div
            v-if="nowTop !== null"
            class="position-absolute d-flex align-center"
            :style="{ top: `${nowTop - 5}px`, insetInlineStart: `${GUTTER - 5}px`, insetInlineEnd: 0, zIndex: 2, pointerEvents: 'none' }"
          >
            <v-sheet color="error" rounded="circle" width="10" height="10" />
            <v-sheet color="error" height="2" class="flex-grow-1" />
          </div>
        </div>
      </v-sheet>

      <!-- Shifts that can't be placed on the grid -->
      <div v-if="missingTiming.length > 0" class="d-flex flex-wrap align-center ga-2 mb-6">
        <span class="text-body-2 font-weight-bold text-warning">ללא שעה:</span>
        <v-chip
          v-for="person in missingTiming"
          :key="person.shiftId"
          :color="ShiftRoleColors[person.role]"
          variant="tonal"
          size="small"
          class="font-weight-bold"
        >
          {{ person.fullName }}
        </v-chip>
      </div>
    </v-container>

    <!-- Everyone in the tapped arrival group -->
    <v-bottom-sheet v-model="sheetOpen" inset>
      <v-card v-if="openedGroup" rounded="t-xl" class="pa-4">
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon icon="mdi-clock-outline" color="primary" />
          <span class="text-h6 font-weight-bold">
            {{ openedGroup.time }} · {{ openedGroup.people.length }} מגיעים
          </span>
          <v-spacer />
          <AppButton variant="text" icon="mdi-close" aria-label="סגור" @click="sheetOpen = false" />
        </div>
        <div class="overflow-y-auto" :style="{ maxHeight: '60dvh' }">
          <div v-for="role in openedGroup.byRole" :key="role.role" class="mb-3">
            <div class="text-caption font-weight-bold mb-1" :class="`text-${role.color}`">
              {{ role.label }} ({{ role.people.length }})
            </div>
            <div
              v-for="person in role.people"
              :key="person.shiftId"
              class="d-flex align-center ga-3 py-2 border-b"
            >
              <InitialsAvatar :name="person.fullName" :color="role.color" :size="36" />
              <span class="text-body-1 font-weight-bold flex-grow-1">{{ person.fullName }}</span>
              <v-icon
                :icon="person.approved ? 'mdi-check-decagram' : 'mdi-clock-outline'"
                :color="person.approved ? 'success' : 'grey'"
                size="small"
                :aria-label="person.approved ? 'משמרת מאושרת' : 'משמרת לא אושרה'"
              />
              <AppButton
                v-if="person.phone"
                :href="`tel:${person.phone}`"
                variant="text"
                color="primary"
                size="small"
                icon="mdi-phone"
                :aria-label="`התקשר ל${person.fullName}`"
              />
            </div>
          </div>
        </div>
      </v-card>
    </v-bottom-sheet>
  </v-col>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { VSheet } from 'vuetify/components'

import { SessionStore } from '@stores'
import {
  useShiftArrivals,
  ShiftRoleColors,
  GRID_PAD_TOP,
  ZOOM_MIN,
  ZOOM_MAX,
} from '@shift/composables/shift.arrivals'
import type { IArrivalGroup } from '@shift/composables/shift.arrivals'

import PageHeader from '@shared/components/layout/PageHeader.vue'
import AppButton from '@shared/components/layout/AppButton.vue'
import InitialsAvatar from '@shared/components/layout/InitialsAvatar.vue'
import EmptyState from '@shared/components/data/EmptyState.vue'

import { UserRole } from '@auth/types/IUser.types'

const GUTTER = 56
const ZOOM_STEP = 1.5

// Width of the blocks area, so names spread into columns on wide screens
const blocksArea = ref<HTMLElement | null>(null)
const areaWidth = ref(0)
const areaObserver = new ResizeObserver(([entry]) => {
  areaWidth.value = entry?.contentRect.width ?? 0
})
onUnmounted(() => areaObserver.disconnect())

const router = useRouter()
const route = useRoute()
const sessionStore = SessionStore()

const {
  arrivalGroups,
  missingTiming,
  nextGroup,
  pxPerHour,
  setZoom,
  gridHeight,
  hourMarks,
  halfHourTops,
  nowTop,
  blocks,
  topOf,
} = useShiftArrivals(areaWidth)

const headerDesc = computed(() => {
  const name = sessionStore.session?.name
  return name ? `מי מגיע ומתי לאירוע ${name}` : 'מי מגיע ומתי לאירוע'
})

const blockColor = (group: IArrivalGroup) => {
  if (group.key === nextGroup.value?.key) return 'success'
  if (group.passed) return 'grey'
  return 'primary'
}

// Bottom sheet with the full group
const sheetOpen = ref(false)
const openedGroup = ref<IArrivalGroup | null>(null)
const openGroup = (group: IArrivalGroup) => {
  openedGroup.value = group
  sheetOpen.value = true
}

const scrollSheet = ref<VSheet | null>(null)
const scrollEl = () => (scrollSheet.value?.$el as HTMLElement | undefined) ?? null

const scrollToTop = (top: number) => {
  scrollEl()?.scrollTo({ top: Math.max(0, top - 60), behavior: 'smooth' })
}

// Zoom keeping the time under the anchor (cursor, fingers or view centre) in place
const zoomAround = async (target: number, anchorClientY?: number) => {
  const el = scrollEl()
  if (!el) return setZoom(target)
  const rect = el.getBoundingClientRect()
  const offsetY = anchorClientY !== undefined ? anchorClientY - rect.top : el.clientHeight / 2
  const hoursAtAnchor = (el.scrollTop + offsetY - GRID_PAD_TOP) / pxPerHour.value
  setZoom(target)
  await nextTick()
  el.scrollTop = hoursAtAnchor * pxPerHour.value + GRID_PAD_TOP - offsetY
}

const zoomBy = (factor: number) => zoomAround(pxPerHour.value * factor)

// Laptop: ctrl/⌘ + wheel, which is also what a trackpad pinch sends
const onWheel = (e: WheelEvent) => {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  zoomAround(pxPerHour.value * Math.exp(-e.deltaY * 0.01), e.clientY)
}

// Mobile: two-finger pinch
let pinchStartDist = 0
let pinchStartZoom = 0
const touchDist = (e: TouchEvent) => {
  const [a, b] = [e.touches[0], e.touches[1]]
  return a && b ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) : 0
}
const touchMidY = (e: TouchEvent) => {
  const [a, b] = [e.touches[0], e.touches[1]]
  return a && b ? (a.clientY + b.clientY) / 2 : undefined
}

const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length !== 2) return
  pinchStartDist = touchDist(e)
  pinchStartZoom = pxPerHour.value
}

const onTouchMove = (e: TouchEvent) => {
  if (e.touches.length !== 2 || !pinchStartDist) return
  e.preventDefault()
  zoomAround(pinchStartZoom * (touchDist(e) / pinchStartDist), touchMidY(e))
}

const onTouchEnd = (e: TouchEvent) => {
  if (e.touches.length < 2) pinchStartDist = 0
}

// Open on the next arrival group, or the first one
onMounted(async () => {
  await nextTick()
  if (blocksArea.value) areaObserver.observe(blocksArea.value)
  const target = nextGroup.value ?? arrivalGroups.value[0]
  if (target) scrollEl()?.scrollTo({ top: Math.max(0, topOf(target.minute) - 60) })
})

const goBack = () => {
  router.push({
    name: 'session-details',
    params: { clientId: route.params.clientId, id: route.params.id },
  })
}
</script>
