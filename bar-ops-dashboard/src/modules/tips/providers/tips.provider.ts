// Import repository
import tipsRepository from '@tips/repository/tips.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type { ITips, ICreateTips, IUpdateTips } from '@tips/types/ITips.types'
import type { ITipsFilters } from '@tips/types/ITipsRepository.types'

// Extend base provider
export const tipsProvider = new BaseCrudProvider<
  ITips,
  ICreateTips,
  IUpdateTips,
  ITips,
  ITipsFilters
>(tipsRepository)
