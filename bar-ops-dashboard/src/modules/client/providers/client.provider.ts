// Import repository
import clientRepository from '@client/repository/client.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type { IClient, ICreateClient, IUpdateClient } from '@client/types/IClient.types'

// Extend base provider
export const clientProvider = new BaseCrudProvider<IClient, ICreateClient, IUpdateClient>(
  clientRepository,
)
