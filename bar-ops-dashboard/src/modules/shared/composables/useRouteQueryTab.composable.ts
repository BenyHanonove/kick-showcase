import { isRef, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useRouteQueryTab<T extends string = string>(
  queryKey: string = 'type',
  defaultValue: T = 'all' as T,
  allowedValues?: T[] | Ref<T[]>,
) {
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref<string>(defaultValue)

  watch(
    () => [route.query[queryKey], allowedValues],
    ([newType, currentAllowed]) => {
      const allowedArray = isRef(currentAllowed) ? currentAllowed.value : currentAllowed

      if (newType && typeof newType === 'string') {
        if (!allowedArray || allowedArray.includes(newType)) {
          activeTab.value = newType
          return
        }
      }
      activeTab.value = defaultValue
    },
    { immediate: true },
  )

  watch(activeTab, (newTab) => {
    const currentQueryVal = route.query[queryKey]
    if (newTab === defaultValue) {
      if (currentQueryVal) {
        const rest = { ...route.query }
        delete rest[queryKey]
        router.replace({ query: rest })
      }
    } else {
      if (currentQueryVal !== newTab) {
        router.replace({ query: { ...route.query, [queryKey]: newTab } })
      }
    }
  })

  return activeTab
}
