<template>
  <div v-if="props.loading" class="d-flex justify-center align-center py-12">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <div v-else-if="!props.items || props.items.length === 0" class="mt-4">
    <EmptyState :icon="props.emptyIcon" :feature="props.emptyFeature" />
  </div>
  <div v-else class="app-table-wrapper">
    <!-- Collapsible Columns Toggler & Download -->
    <div class="d-flex justify-end ga-2 mb-3">
      <AppButton
        variant="flat"
        size="small"
        density="comfortable"
        class="action-btn elevation-1"
        @click="downloadExcel"
      >
        <v-icon size="22">mdi-microsoft-excel</v-icon>
        <v-tooltip activator="parent" location="top" text="הורדה כ-Excel" />
      </AppButton>
      <AppButton
        variant="flat"
        size="small"
        density="comfortable"
        class="action-btn elevation-1"
        :class="{ 'active-toggle': showColumnToggler }"
        @click="showColumnToggler = !showColumnToggler"
      >
        <v-icon size="22">mdi-filter-variant</v-icon>
        <v-tooltip activator="parent" location="top" text="הצג/הסתר עמודות" />
      </AppButton>
    </div>

    <!-- Collapsible Columns Selection area -->
    <v-expand-transition>
      <div
        v-if="showColumnToggler"
        class="d-flex flex-wrap ga-2 px-4 py-3 mb-4 rounded-xl column-toggler-panel"
      >
        <div class="text-caption w-100 mb-1 text-medium-emphasis font-weight-bold">
          עמודות מוצגות:
        </div>
        <v-chip
          v-for="header in normalizedHeaders"
          :key="header.key"
          :color="hiddenKeys.has(header.key) ? 'grey-lighten-2' : 'primary'"
          variant="flat"
          size="default"
          class="font-weight-medium transition-all"
          :class="{ 'opacity-60': hiddenKeys.has(header.key) }"
          @click="toggleColumn(header.key)"
        >
          <v-icon
            start
            size="14"
            :icon="hiddenKeys.has(header.key) ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          />
          {{ getColumnLabel(header) }}
        </v-chip>
      </div>
    </v-expand-transition>

    <!-- Table Container -->
    <div class="app-table-container" :class="{ 'has-sticky-first-col': props.stickyFirstColumn }">
      <v-table v-bind="$attrs" class="app-table">
        <thead>
          <tr>
            <th
              v-for="header in visibleHeaders"
              :key="header.key"
              :class="[
                getAlignClass(header.align),
                header.class,
                { pointer: isSortable(header.key) },
              ]"
              @click="isSortable(header.key) && handleHeaderClick(header.key)"
            >
              <div class="d-inline-flex align-center ga-1">
                <slot :name="`header(${header.key})`" :header="header">
                  {{ header.label }}
                </slot>
                <v-icon
                  v-if="isSortable(header.key)"
                  size="14"
                  class="sort-icon"
                  :class="{ 'active-sort': sortKey === header.key }"
                  :icon="getSortIcon(header.key)"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in sortedItems"
            :key="getItemKey(item, index)"
            :class="props.rowClass ? props.rowClass(item, index) : ''"
          >
            <td
              v-for="header in visibleHeaders"
              :key="header.key"
              :class="[getAlignClass(header.align), header.cellClass]"
            >
              <slot
                :name="header.key"
                :item="item"
                :value="getItemValue(item, header.key)"
                :index="index"
              >
                <component
                  v-if="isComponentValue(getItemValue(item, header.key))"
                  :is="getItemValue(item, header.key)"
                />
                <span
                  v-else-if="
                    getItemValue(item, header.key) !== null &&
                    getItemValue(item, header.key) !== undefined
                  "
                >
                  {{ getItemValue(item, header.key) }}
                </span>
                <span v-else class="text-disabled">—</span>
              </slot>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="$slots.footer || props.hasFooter">
          <slot name="footer" :headers="visibleHeaders" :items="sortedItems"></slot>
        </tfoot>
      </v-table>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends object">
import { computed, isVNode, ref } from 'vue'
import ExcelJS from 'exceljs'
import EmptyState from './EmptyState.vue'

export interface TableHeader<T extends object = object> {
  key: string
  label: string
  align?: 'right' | 'center' | 'left' | 'start' | 'end'
  class?: string
  cellClass?: string
  /** Override the exported cell value for slot-rendered columns. */
  exportValue?: (item: T) => string | number | boolean | null
}

// Define props
const props = withDefaults(
  defineProps<{
    items: T[]
    headers?: Array<TableHeader<T> | string>
    stickyFirstColumn?: boolean
    hasFooter?: boolean
    rowClass?: (item: T, index: number) => string
    loading?: boolean
    emptyIcon?: string
    emptyFeature?: string
  }>(),
  {
    stickyFirstColumn: true,
    hasFooter: false,
    loading: false,
    emptyIcon: 'mdi-alert-circle-outline',
    emptyFeature: 'נתונים',
  },
)

// Column visibility states
const showColumnToggler = ref(false)
const hiddenKeys = ref<Set<string>>(new Set())

// Internal row type — every item is treated as a plain value map
type Row = Record<string, string | number | boolean | null>

// Helper to safely get properties on generic object T
const getItemValue = (item: T, key: string): string | number | boolean | null => {
  return (item as Row)[key] ?? null
}

// Normalize headers to always be TableHeader objects
const normalizedHeaders = computed<TableHeader[]>(() => {
  if (!props.headers || props.headers.length === 0) {
    // Fallback: extract keys from the first item
    const firstItem = props.items[0]
    if (!firstItem) return []
    return Object.keys(firstItem)
      .filter((k) => k !== 'id')
      .map((k) => ({
        key: k,
        label: k,
      }))
  }

  return props.headers.map((h) => {
    if (typeof h === 'string') {
      return { key: h, label: h }
    }
    return h
  })
})

// Filter visible headers based on visibility selector
const visibleHeaders = computed<TableHeader[]>(() => {
  return normalizedHeaders.value.filter((h) => !hiddenKeys.value.has(h.key))
})

// Sorting states
const sortKey = ref<string | null>(null)
const sortOrder = ref<'asc' | 'desc' | null>(null)

// Check if a header key is sortable
const isSortable = (key: string) => {
  return key !== 'actions' && key !== 'select'
}

// Toggle sorting order
const handleHeaderClick = (key: string) => {
  if (!isSortable(key)) return
  if (sortKey.value === key) {
    if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc'
    } else if (sortOrder.value === 'desc') {
      sortKey.value = null
      sortOrder.value = null
    }
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

// Get the correct sort icon
const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return 'mdi-sort'
  return sortOrder.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

// Computed sorted items list
const sortedItems = computed(() => {
  if (!props.items) return []
  if (!sortKey.value || !sortOrder.value) return props.items

  const key = sortKey.value as string
  const order = sortOrder.value

  return [...props.items].sort((a, b) => {
    const valA = (a as Row)[key]
    const valB = (b as Row)[key]

    // Handle null/undefined values
    if (valA === null || valA === undefined) return order === 'asc' ? 1 : -1
    if (valB === null || valB === undefined) return order === 'asc' ? -1 : 1

    // If text, use localeCompare
    if (typeof valA === 'string' && typeof valB === 'string') {
      return order === 'asc'
        ? valA.localeCompare(valB, 'he', { numeric: true })
        : valB.localeCompare(valA, 'he', { numeric: true })
    }

    // Otherwise, standard type-safe comparison
    if (typeof valA === 'number' && typeof valB === 'number') {
      return order === 'asc' ? valA - valB : valB - valA
    }
    const strA = String(valA)
    const strB = String(valB)
    return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
  })
})

// Toggle column visibility
const toggleColumn = (key: string) => {
  const newSet = new Set(hiddenKeys.value)
  if (newSet.has(key)) {
    newSet.delete(key)
  } else {
    // Prevent hiding the very last column
    if (newSet.size < normalizedHeaders.value.length - 1) {
      newSet.add(key)
    }
  }
  hiddenKeys.value = newSet
}

// Format empty labels or custom keys for the selector area
const getColumnLabel = (header: TableHeader): string => {
  if (header.label) return header.label
  if (header.key === 'actions') return 'פעולות'
  return header.key
}

// Helper to determine text alignment classes
const getAlignClass = (align?: TableHeader['align']) => {
  if (!align) return 'text-right' // Default alignment is right (in RTL Hebrew context)
  if (align === 'center') return 'text-center'
  if (align === 'left' || align === 'end') return 'text-left'
  return 'text-right'
}

// Helper to check if value is a Vue Component / VNode
const isComponentValue = (val: string | number | boolean | null): boolean => {
  if (!val) return false
  if (isVNode(val)) return true
  if (typeof val === 'object') {
    const obj = val as Record<string, () => void>
    return (
      typeof obj.render === 'function' ||
      typeof obj.setup === 'function' ||
      typeof obj.template === 'string' ||
      obj.__name !== undefined ||
      typeof obj.name === 'string'
    )
  }
  if (typeof val === 'function') {
    // Functional component
    return true
  }
  return false
}

// Helper to get type-safe key for item loops
const getItemKey = (item: T, index: number): string | number => {
  const id = (item as Row).id
  if (id !== null && id !== undefined) {
    if (typeof id === 'string' || typeof id === 'number') {
      return id
    }
  }
  return index
}

const downloadExcel = async () => {
  // Build header row from visible headers (respects hidden columns)
  const headerRow = visibleHeaders.value.map((h) => getColumnLabel(h))

  // Build data rows from sorted items (respects current sort order)
  const dataRows = sortedItems.value.map((item) =>
    visibleHeaders.value.map((h) => {
      // Use exportValue override when provided (for slot-rendered columns)
      if (h.exportValue) return h.exportValue(item)
      const val = getItemValue(item, h.key)
      // Skip VNodes / component values — export the raw primitive
      if (isComponentValue(val)) return ''
      if (val === null || val === undefined) return ''
      return val
    }),
  )

  // Compose RTL worksheet: header row + data rows
  const worksheetData = [headerRow, ...dataRows]
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('נתונים', { views: [{ rightToLeft: true }] })
  worksheetData.forEach((row) => worksheet.addRow(row))

  // Auto-fit column widths based on content
  headerRow.forEach((_, colIndex) => {
    const maxLen = worksheetData.reduce((max, row) => {
      const cellVal = String(row[colIndex] ?? '')
      return Math.max(max, cellVal.length)
    }, 10)
    worksheet.getColumn(colIndex + 1).width = Math.min(maxLen + 2, 40)
  })

  // Write to a buffer and trigger a browser download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const timestamp = new Date().toISOString().slice(0, 10)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `table-export-${timestamp}.xlsx`
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.app-table-wrapper {
  margin-bottom: 1rem;
}

.action-btn {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
  border: 1px solid rgba(var(--v-border-color), 0.12) !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px !important;
  height: 40px !important;
  width: 40px !important;
  min-width: 0 !important;
  padding: 0 !important;
}

.action-btn:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05) !important;
  color: rgb(var(--v-theme-primary)) !important;
  transform: translateY(-2px);
}

.action-btn.active-toggle {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
  color: rgb(var(--v-theme-primary)) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}

.column-toggler-panel {
  padding: 8px 4px !important;
  transition: all 0.3s ease;
}

.transition-all {
  transition: all 0.2s ease;
}

.opacity-60 {
  opacity: 0.6;
}

.app-table-container {
  width: 100%;
  overflow-x: auto;
  position: relative;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-border-color), 0.08);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  background: rgb(var(--v-theme-surface));
  transition: box-shadow 0.3s ease;
}

.app-table-container:hover {
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08);
}

/* Elegant table header styles */
.app-table :deep(thead) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.app-table :deep(th) {
  font-weight: 700 !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  font-size: 0.85rem !important;
  letter-spacing: 0.02em;
  padding: 14px 16px !important;
  border-bottom: 2px solid rgba(var(--v-border-color), 0.1) !important;
}

/* Row animations and interactions */
.app-table :deep(tbody tr) {
  transition: all 0.2s ease;
}

.app-table :deep(tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.02) !important;
}

.app-table :deep(td) {
  padding: 14px 16px !important;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.06) !important;
  font-size: 0.9rem;
}

/* Apply border collapse separation to allow sticky columns to render background and borders correctly */
.app-table-container.has-sticky-first-col :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
}

/* Sticky first column settings using CSS logical properties */
.app-table-container.has-sticky-first-col :deep(th:first-child),
.app-table-container.has-sticky-first-col :deep(td:first-child) {
  position: sticky;
  inset-inline-start: 0;
  z-index: 2;
  /* Match the table's background color so scroll content slides underneath */
  background-color: rgb(var(--v-theme-surface)) !important;
}

/* Higher stack context for the first column header */
.app-table-container.has-sticky-first-col :deep(th:first-child) {
  z-index: 3;
}

/* Border separation line for sticky column */
.app-table-container.has-sticky-first-col :deep(th:first-child)::after,
.app-table-container.has-sticky-first-col :deep(td:first-child)::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  inset-inline-end: 0;
  width: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity, 0.12));
}

/* Custom scrollbar adjustments for a clean look */
.app-table-container::-webkit-scrollbar {
  height: 6px;
}
.app-table-container::-webkit-scrollbar-track {
  background: transparent;
}
.app-table-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-border-color), 0.2);
  border-radius: 4px;
}
.app-table-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-border-color), 0.4);
}

.pointer {
  cursor: pointer;
  user-select: none;
}
.sort-icon {
  opacity: 0.15;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    color 0.2s ease;
}
.app-table :deep(th:hover) .sort-icon {
  opacity: 0.55;
}
.sort-icon.active-sort {
  opacity: 1 !important;
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
