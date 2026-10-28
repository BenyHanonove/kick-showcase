import missionsRepository from '@missions/repository/missions.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type { IMission, ICreateMission, IUpdateMission } from '@missions/types/IMission.types'
import type { IMissionsFilters } from '@missions/types/IMissionsRepository.types'

export const missionsProvider = new BaseCrudProvider<
  IMission,
  ICreateMission,
  IUpdateMission,
  IMission,
  IMissionsFilters
>(missionsRepository)
