<template>
  <v-card variant="outlined" class="rounded-lg pa-3 bg-surface border-opacity-40">
    <div v-if="label" class="text-caption font-weight-bold mb-2 text-medium-emphasis">
      {{ label }}
    </div>

    <!-- Search filter -->
    <v-text-field
      v-model="searchQuery"
      :placeholder="placeholder"
      density="compact"
      variant="outlined"
      hide-details
      prepend-inner-icon="mdi-magnify"
      clearable
      class="mb-2"
    />

    <!-- Scrollable list of options -->
    <div :style="{ maxHeight: height }" class="overflow-y-auto list-container pr-1">
      <v-list density="compact" class="py-0">
        <template v-if="filteredItems.length > 0">
          <v-list-item
            v-for="item in filteredItems"
            :key="item.value"
            :value="item.value"
            :active="isSelected(item.value)"
            class="rounded-md mb-1"
            color="primary"
            @click="toggleItem(item.value)"
          >
            <template #prepend>
              <v-checkbox-btn
                :model-value="isSelected(item.value)"
                color="primary"
                hide-details
                density="compact"
                class="mr-2"
                @click.stop="toggleItem(item.value)"
              />
            </template>
            <v-list-item-title class="font-weight-medium">
              {{ item.title }}
            </v-list-item-title>
          </v-list-item>
        </template>
        <div v-else class="text-center py-6 text-caption text-medium-emphasis">לא נמצאו תוצאות</div>
      </v-list>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface ISelectItem {
  title: string
  value: string | number
}

const model = defineModel<string | number | (string | number)[] | undefined>()

const props = withDefaults(
  defineProps<{
    items: ISelectItem[]
    label?: string
    placeholder?: string
    multiple?: boolean
    height?: string
  }>(),
  {
    placeholder: 'חפש ברשימה...',
    multiple: false,
    height: '220px',
  },
)

const searchQuery = ref('')

// Local filter logic
const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items
  const query = searchQuery.value.toLowerCase()
  return props.items.filter((item) => item.title.toLowerCase().includes(query))
})

const isSelected = (val: string | number): boolean => {
  if (props.multiple) {
    const list = Array.isArray(model.value) ? model.value : []
    return list.includes(val)
  }
  return model.value === val
}

const toggleItem = (val: string | number) => {
  if (props.multiple) {
    const current = Array.isArray(model.value) ? [...model.value] : []
    const index = current.indexOf(val)
    if (index === -1) {
      current.push(val)
    } else {
      current.splice(index, 1)
    }
    model.value = current
  } else {
    model.value = model.value === val ? undefined : val
  }
}
</script>

<style scoped>
.list-container::-webkit-scrollbar {
  width: 5px;
}
.list-container::-webkit-scrollbar-track {
  background: transparent;
}
.list-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-border-color), 0.2);
  border-radius: 4px;
}
.list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-border-color), 0.4);
}
</style>
