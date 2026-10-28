// Import vue APIs
import { ref, computed, watch } from 'vue'

// Import stores
import { EmployeesStore } from '@stores'

// Import composables
import { useEmployeeCrud } from '@employee/composables/employee.crud'

// Import types
import { EmployeeStatus } from '@employee/types/EmployeeStatus.types'
import type { EmployeeLevel } from '@employee/types/EmployeeLevel.types'
import type { IEmployee } from '@employee/types/IEmployee.types'

// Export employee rating composable
export function useEmployeeRate() {
  const employeesStore = EmployeesStore()
  const EmployeeCrud = useEmployeeCrud()

  // Only accepted employees are rated
  const approvedEmployees = computed(() =>
    (employeesStore.employees || []).filter((e) => Boolean(e) && e.status !== EmployeeStatus.PENDING),
  )

  // Snapshot of ids so rating an employee doesn't reshuffle the queue mid-round
  const queueIds = ref<string[]>([])
  const index = ref(0)
  const ratedCount = ref(0)

  const buildQueue = () => {
    queueIds.value = approvedEmployees.value
      .filter((e) => !e.level)
      .map((e) => e.id)
    index.value = 0
    ratedCount.value = 0
  }

  // Drop employees removed from the store during the round
  const queue = computed(() =>
    queueIds.value
      .map((id) => employeesStore.get(id))
      .filter((e): e is IEmployee => Boolean(e)),
  )

  const current = computed(() => queue.value[index.value] ?? null)
  const isFinished = computed(() => queue.value.length > 0 && index.value >= queue.value.length)

  // Save the level through the shared CRUD flow, advance only when it stuck
  const rate = async (level: EmployeeLevel) => {
    const employee = current.value
    if (!employee || EmployeeCrud.isUpdating.value) return

    EmployeeCrud.openUpdate(employee)
    await EmployeeCrud.handleUpdate({ id: employee.id, timestamp: employee.timestamp, level })
    EmployeeCrud.updateDialogOpen.value = false

    if (employeesStore.get(employee.id)?.level !== level) return

    ratedCount.value++
    index.value++
  }

  const skip = () => {
    if (!isFinished.value) index.value++
  }

  const back = () => {
    if (index.value > 0) index.value--
  }

  // Build once employees are loaded
  watch(() => employeesStore.loading, (loading) => !loading && buildQueue(), { immediate: true })

  return {
    isSaving: EmployeeCrud.isUpdating,
    loading: computed(() => employeesStore.loading),
    queue,
    index,
    current,
    isFinished,
    ratedCount,
    rate,
    skip,
    back,
    restart: buildQueue,
  }
}
