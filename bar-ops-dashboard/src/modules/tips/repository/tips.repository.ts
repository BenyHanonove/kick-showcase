import { BaseRepository } from '@shared/repository/base.repository'

import type { ITips, ICreateTips, IUpdateTips } from '@tips/types/ITips.types'
import type { ITipsFilters, ITipsRepository } from '@tips/types/ITipsRepository.types'

const tipsRepository: ITipsRepository = new BaseRepository<
  ITips,
  ICreateTips,
  IUpdateTips,
  ITips,
  ITipsFilters
>('/tips', 'tips', 'tip')

export default tipsRepository
