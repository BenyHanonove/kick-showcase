import { BaseRepository } from '@shared/repository/base.repository'

import type { IConsume, ICreateConsume, IUpdateConsume } from '@consume/types/IConsume.types'
import type { IConsumeFilters, IConsumeRepository } from '@consume/types/IConsumeRepository.types'

const consumeRepository: IConsumeRepository = new BaseRepository<
  IConsume,
  ICreateConsume,
  IUpdateConsume,
  IConsume,
  IConsumeFilters
>('/consume', 'consumes', 'consume')

export default consumeRepository
