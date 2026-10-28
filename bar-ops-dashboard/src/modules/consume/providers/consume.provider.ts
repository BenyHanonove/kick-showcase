import consumeRepository from '@consume/repository/consume.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type { IConsume, ICreateConsume, IUpdateConsume } from '@consume/types/IConsume.types'
import type { IConsumeFilters } from '@consume/types/IConsumeRepository.types'

export const consumeProvider = new BaseCrudProvider<
  IConsume,
  ICreateConsume,
  IUpdateConsume,
  IConsume,
  IConsumeFilters
>(consumeRepository)
