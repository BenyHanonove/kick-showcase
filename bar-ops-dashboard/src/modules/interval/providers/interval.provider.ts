import intervalRepository from '@interval/repository/interval.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type { IInterval, ICreateInterval, IUpdateInterval } from '@interval/types/IInterval.types'
import type { IIntervalFilters } from '@interval/types/IIntervalRepository.types'

export const intervalProvider = new BaseCrudProvider<
  IInterval,
  ICreateInterval,
  IUpdateInterval,
  IInterval,
  IIntervalFilters
>(intervalRepository)
