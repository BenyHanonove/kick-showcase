// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

// Import types
import type { ITips, ICreateTips, IUpdateTips } from '@tips/types/ITips.types'
import type { ITipsFilters, ITipsRepository } from '@tips/types/ITipsRepository.types'

// Extend base repository
const tipsRepository: ITipsRepository = new BaseRepository<
  ITips,
  ICreateTips,
  IUpdateTips,
  ITips,
  ITipsFilters
>('/tips', 'tips', 'tip')

export default tipsRepository
