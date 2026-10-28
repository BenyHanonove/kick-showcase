import { BaseRepository } from '@shared/repository/base.repository'

import type { IClient, ICreateClient, IUpdateClient } from '@client/types/IClient.types'
import type { IClientRepository } from '@client/types/IClientRepository.types'

const clientRepository: IClientRepository = new BaseRepository<
  IClient,
  ICreateClient,
  IUpdateClient
>('/client', 'clients', 'client')

export default clientRepository
