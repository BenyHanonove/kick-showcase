// Import repository
import missionsRepository from '@missions/repository/missions.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type { IMission, ICreateMission, IUpdateMission } from '@missions/types/IMission.types'
import type { IMissionsFilters } from '@missions/types/IMissionsRepository.types'

// Extend base provider
export const missionsProvider = new BaseCrudProvider<
  IMission,
  ICreateMission,
  IUpdateMission,
  IMission,
  IMissionsFilters
>(missionsRepository)
