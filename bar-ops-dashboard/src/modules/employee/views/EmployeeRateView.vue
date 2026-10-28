<template>
  <v-container>
    <PageHeader
      :path="['בית', 'עובדים', 'דרג עובדים']"
      title="דרג עובדים"
      desc="קביעת רמה לכל עובד מאושר (ניתן להשתמש במקשים 1–5)"
      :min-role="UserRole.ADMIN"
    />

    <GlobalLoading v-if="loading && !queue.length" />

    <template v-else>
      <EmptyState v-if="!queue.length" icon="mdi-account-check-outline" feature="עובדים לדירוג" />

      <div v-else class="rate-wrap mx-auto mt-2">
        <!-- Round completed -->
        <ModuleSummaryCard v-if="isFinished" title="הדירוג הושלם" icon="mdi-check-circle-outline" icon-color="success">
          <div class="d-flex align-center justify-space-between">
            <span class="text-body-2 text-medium-emphasis">עובדים שדורגו</span>
            <span class="text-body-2 font-weight-bold">{{ ratedCount }} / {{ queue.length }}</span>
          </div>
          <div class="d-flex justify-end flex-wrap ga-2 mt-6">
            <AppButton variant="secondary" prepend-icon="mdi-restart" @click="restart">התחל מחדש</AppButton>
            <AppButton prepend-icon="mdi-arrow-right" @click="router.push({ name: 'employees' })">
              חזרה לעובדים
            </AppButton>
          </div>
        </ModuleSummaryCard>

        <!-- Employee + level selection -->
        <ModuleSummaryCard v-else-if="current" title="בחירת רמה" icon="mdi-account-star-outline" icon-color="primary">
          <div class="d-flex flex-column align-center text-center">
            <span class="text-h5 font-weight-bold">{{ fullName }}</span>
            <a
              v-if="instagramHandle"
              :href="`https://instagram.com/${instagramHandle}`"
              target="_blank"
              rel="noopener noreferrer"
              class="instagram-link d-inline-flex align-center ga-1 text-body-2 text-medium-emphasis mt-1"
              dir="ltr"
            >
              <v-icon icon="mdi-instagram" size="16" />
              {{ instagramHandle }}
            </a>
          </div>

          <div class="level-grid mt-6" :class="{ 'level-grid--saving': isSaving }">
            <v-btn
              v-for="level in EmployeeLevelOrder"
              :key="level"
              :color="current.level === level ? EmployeeLevelColors[level] : undefined"
              :variant="current.level === level ? 'flat' : 'tonal'"
              class="level-btn"
              rounded="lg"
              height="64"
              stacked
              @click="rate(level)"
            >
              <v-icon
                :icon="EmployeeLevelIcons[level]"
                :color="current.level === level ? undefined : EmployeeLevelColors[level]"
                size="20"
              />
              <span class="text-caption font-weight-medium mt-1">{{ EmployeeLevelLabels[level] }}</span>
            </v-btn>
          </div>

          <v-divider class="mt-6 mb-3" />

          <div class="d-flex justify-space-between">
            <AppButton variant="tertiary" size="small" prepend-icon="mdi-chevron-right" :disabled="index === 0" @click="back">
              הקודם
            </AppButton>
            <AppButton variant="tertiary" size="small" append-icon="mdi-chevron-left" :disabled="isSaving" @click="skip">
              דלג
            </AppButton>
          </div>
        </ModuleSummaryCard>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

// Import types
import { UserRole } from '@auth/types/IUser.types'
import {
  EmployeeLevelColors,
  EmployeeLevelIcons,
  EmployeeLevelLabels,
  EmployeeLevelOrder,
} from '@employee/types/EmployeeLevel.types'

// Import composables
import { useEmployeeRate } from '@employee/composables/employee.rate'

// Import components
import PageHeader from '@shared/components/layout/PageHeader.vue'
import ModuleSummaryCard from '@shared/components/layout/ModuleSummaryCard.vue'
import AppButton from '@shared/components/layout/AppButton.vue'
import EmptyState from '@shared/components/data/EmptyState.vue'
import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'

const router = useRouter()

const {
  loading,
  isSaving,
  queue,
  index,
  current,
  isFinished,
  ratedCount,
  rate,
  skip,
  back,
  restart,
} = useEmployeeRate()

const fullName = computed(() => (current.value ? `${current.value.firstName} ${current.value.lastName}` : ''))
const instagramHandle = computed(() => current.value?.instagram?.trim().replace('@', '') ?? '')

// Keys 1-5 set the level, arrows move (RTL: left = next, right = previous)
const onKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
  if (!current.value || isFinished.value) return

  const level = EmployeeLevelOrder[Number(event.key) - 1]
  if (level) rate(level)
  else if (event.key === 'ArrowLeft') skip()
  else if (event.key === 'ArrowRight') back()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.rate-wrap {
  max-width: 520px;
}
.instagram-link {
  text-decoration: none;
  transition: color 0.2s;
}
.instagram-link:hover {
  color: rgb(var(--v-theme-primary)) !important;
}
.level-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.level-btn {
  min-width: 0;
  text-transform: none;
  letter-spacing: normal;
}
.level-grid--saving {
  opacity: 0.5;
  pointer-events: none;
}
</style>
