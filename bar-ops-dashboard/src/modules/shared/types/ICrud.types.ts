// Import provider result type
import type { IProviderResult } from '@shared/providers/base.provider'

// Interface for CRUD providers
export interface ICrudProvider<TEntity, TCreate, TUpdate> {
  get(id: string): Promise<IProviderResult<TEntity>>
  create(data: TCreate): Promise<IProviderResult<TEntity>>
  update(id: string, data: TUpdate): Promise<IProviderResult<TEntity>>
  delete(id: string): Promise<IProviderResult<boolean>>
}

// Interface for CRUD stores
export interface ICrudStore<TEntity> {
  add(item: TEntity): void
  update(item: TEntity): void
  remove(id: string): void
}
