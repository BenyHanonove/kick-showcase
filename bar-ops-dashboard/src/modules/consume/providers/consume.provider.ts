// Import repository
import consumeRepository from '@consume/repository/consume.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type { IConsume, ICreateConsume, IUpdateConsume } from '@consume/types/IConsume.types'
import type { IConsumeFilters } from '@consume/types/IConsumeRepository.types'

// Extend base provider
export const consumeProvider = new BaseCrudProvider<
  IConsume,
  ICreateConsume,
  IUpdateConsume,
  IConsume,
  IConsumeFilters
>(consumeRepository)
