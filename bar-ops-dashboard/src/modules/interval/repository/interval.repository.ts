import { BaseRepository } from '@shared/repository/base.repository'

import type { IInterval, ICreateInterval, IUpdateInterval } from '@interval/types/IInterval.types'
import type {
  IIntervalFilters,
  IIntervalRepository,
} from '@interval/types/IIntervalRepository.types'

const intervalRepository: IIntervalRepository = new BaseRepository<
  IInterval,
  ICreateInterval,
  IUpdateInterval,
  IInterval,
  IIntervalFilters
>('/interval', 'intervals', 'interval')

export default intervalRepository
