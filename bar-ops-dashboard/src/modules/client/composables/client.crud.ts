// Import validation rules
import { rules } from '@shared/utils/rules.util'

// Import stores
import { ClientsStore } from '@stores'

// Import providers
import { clientProvider } from '@client/providers/client.provider'

// Import composables
import { useCrud } from '@shared/composables/crud.composable'

// Import types
import type { ICreateClient } from '@client/types/IClient.types'
import type { IFormField } from '@shared/types/IForm.types'

// Export client crud composable
export const useClientCrud = () => {
  const crud = useCrud(clientProvider, ClientsStore())

  const clientInitialState: ICreateClient = {
    name: '',
    brand: '',
    email: '',
    phone: '',
  }

  const clientFields: IFormField[] = [
    {
      key: 'name',
      label: 'שם מלא*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'brand',
      label: 'מותג / חברה*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'email',
      label: 'אימייל',
      type: 'text',
    },
    {
      key: 'phone',
      label: 'מספר טלפון*',
      type: 'text',
      rules: [rules.required()],
    },
  ]

  return {
    ...crud,
    clientFields,
    clientInitialState,
  }
}
