<template>
  <div class="loading-wrapper">
    <v-progress-circular indeterminate :color="color" :size="size" :width="width" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  color?: string
  size?: string | number
  width?: string | number
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  size: 82,
  width: 6,
})
</script>

<style scoped>
.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 200px;
  height: 100%;
}
</style>
