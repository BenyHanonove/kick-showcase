import tipsRepository from '@tips/repository/tips.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type { ITips, ICreateTips, IUpdateTips } from '@tips/types/ITips.types'
import type { ITipsFilters } from '@tips/types/ITipsRepository.types'

export const tipsProvider = new BaseCrudProvider<
  ITips,
  ICreateTips,
  IUpdateTips,
  ITips,
  ITipsFilters
>(tipsRepository)
