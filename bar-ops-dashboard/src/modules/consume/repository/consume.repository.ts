// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

// Import types
import type { IConsume, ICreateConsume, IUpdateConsume } from '@consume/types/IConsume.types'
import type { IConsumeFilters, IConsumeRepository } from '@consume/types/IConsumeRepository.types'

// Extend base repository
const consumeRepository: IConsumeRepository = new BaseRepository<
  IConsume,
  ICreateConsume,
  IUpdateConsume,
  IConsume,
  IConsumeFilters
>('/consume', 'consumes', 'consume')

export default consumeRepository
