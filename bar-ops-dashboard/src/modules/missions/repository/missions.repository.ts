import { BaseRepository } from '@shared/repository/base.repository'

import type { IMission, ICreateMission, IUpdateMission } from '@missions/types/IMission.types'
import type {
  IMissionsFilters,
  IMissionsRepository,
} from '@missions/types/IMissionsRepository.types'

const missionsRepository: IMissionsRepository = new BaseRepository<
  IMission,
  ICreateMission,
  IUpdateMission,
  IMission,
  IMissionsFilters
>('/mission', 'missions', 'mission')

export default missionsRepository
