// Import validation rules
import { rules } from '@shared/utils/rules.util'

// Import stores
import { SessionStore } from '@stores'

// Import providers
import { missionsProvider } from '@missions/providers/missions.provider'

// Import composables
import { useCrud } from '@shared/composables/crud.composable'

// Import types
import type { IMission, ICreateMission, IUpdateMission } from '@missions/types/IMission.types'
import type { IFormField } from '@shared/types/IForm.types'
import { missionStatusOptions } from '@missions/types/status.types'

// Export missions crud composable
export const useMissionsCrud = () => {
  const store = SessionStore()
  const crud = useCrud<IMission, ICreateMission, IUpdateMission>(missionsProvider, store.missions)

  const missionsFields: IFormField[] = [
    {
      key: 'name',
      label: 'שם המשימה*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'desc',
      label: 'תיאור*',
      type: 'textarea',
      rules: [rules.required()],
    },
    {
      key: 'status',
      label: 'סטטוס',
      type: 'select',
      items: missionStatusOptions,
    },
  ]

  const missionInitialState = (sessionId: string): ICreateMission => ({
    sessionId,
    name: '',
    desc: '',
  })

  return {
    ...crud,
    missionsFields,
    missionInitialState,
  }
}
