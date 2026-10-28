import { rules } from '@shared/utils/rules.util'

import { ClientsStore } from '@stores'

import { clientProvider } from '@client/providers/client.provider'

import { useCrud } from '@shared/composables/crud.composable'

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
