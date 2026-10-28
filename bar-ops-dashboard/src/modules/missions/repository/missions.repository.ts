// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

// Import types
import type { IMission, ICreateMission, IUpdateMission } from '@missions/types/IMission.types'
import type {
  IMissionsFilters,
  IMissionsRepository,
} from '@missions/types/IMissionsRepository.types'

// Extend base repository
const missionsRepository: IMissionsRepository = new BaseRepository<
  IMission,
  ICreateMission,
  IUpdateMission,
  IMission,
  IMissionsFilters
>('/mission', 'missions', 'mission')

export default missionsRepository
