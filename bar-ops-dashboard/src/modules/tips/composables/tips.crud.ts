// Import validation rules
import { rules } from '@shared/utils/rules.util'

// Import stores
import { SessionStore } from '@stores'

// Import composables
import { useCrud } from '@shared/composables/crud.composable'

// Import providers
import { tipsProvider } from '@tips/providers/tips.provider'

// Import types
import type { ITips, ICreateTips, IUpdateTips } from '@tips/types/ITips.types'
import type { IFormField } from '@shared/types/IForm.types'

// Export tips crud composable
export const useTipsCrud = () => {
  const store = SessionStore()
  const crud = useCrud<ITips, ICreateTips, IUpdateTips>(tipsProvider, store.tips)

  const tipsFields: IFormField[] = [
    {
      key: 'cashTip',
      label: 'טיפ מזומן*',
      type: 'number',
      props: { prefix: '₪' },
      rules: [rules.minNumber(0)],
    },
    {
      key: 'runnerFeed',
      label: 'שעתי ראנרים*',
      type: 'number',
      props: { prefix: '₪' },
      rules: [rules.minNumber(0)],
    },
  ]

  return {
    ...crud,
    tipsFields,
  }
}
