// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

// Import types
import type { IClient, ICreateClient, IUpdateClient } from '@client/types/IClient.types'
import type { IClientRepository } from '@client/types/IClientRepository.types'

// Extend base repository
const clientRepository: IClientRepository = new BaseRepository<
  IClient,
  ICreateClient,
  IUpdateClient
>('/client', 'clients', 'client')

export default clientRepository
