// Import repository
import intervalRepository from '@interval/repository/interval.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type { IInterval, ICreateInterval, IUpdateInterval } from '@interval/types/IInterval.types'
import type { IIntervalFilters } from '@interval/types/IIntervalRepository.types'

// Extend base provider
export const intervalProvider = new BaseCrudProvider<
  IInterval,
  ICreateInterval,
  IUpdateInterval,
  IInterval,
  IIntervalFilters
>(intervalRepository)
