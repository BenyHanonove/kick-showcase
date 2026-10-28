<template>
  <slot v-if="hasAccess" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AuthStore, RoleLevel } from '@stores'
import { UserRole } from '@auth/types/IUser.types'

interface Props {
  level: UserRole
  specific?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  specific: false,
})

const auth = AuthStore()

const hasAccess = computed(() => {
  if (!auth.role) return false

  if (props.specific) return auth.role === props.level

  const userLevel = RoleLevel[auth.role] || 0
  const requiredLevel = RoleLevel[props.level] || 0

  return userLevel >= requiredLevel
})
</script>
