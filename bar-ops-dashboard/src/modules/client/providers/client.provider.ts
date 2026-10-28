import clientRepository from '@client/repository/client.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type { IClient, ICreateClient, IUpdateClient } from '@client/types/IClient.types'

export const clientProvider = new BaseCrudProvider<IClient, ICreateClient, IUpdateClient>(
  clientRepository,
)
