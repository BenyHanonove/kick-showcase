import { AxiosError } from 'axios'
import { StatusCodes } from 'http-status-codes'
import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { BaseReceiptRepository } from '@shared/repository/base.repository'
import { extractErrorMessage } from '@shared/utils/extractErrorMessage.util'

// Unified provider outcome contract
export interface IProviderResult<TData> {
  success: boolean
  message: string
  data: TData | null
  statusCode?: number
}

export class BaseProvider {
  protected async safeCall<TData>(
    request: Promise<IApiResponse<TData>>,
    expected: StatusCodes = StatusCodes.OK,
  ): Promise<IProviderResult<TData>> {
    try {
      // Execute request and check status
      const response = await request
      return this.handle(response, expected)
    } catch (error) {
      const message = extractErrorMessage(error as Error | AxiosError, 'ארעה שגיאה בלתי צפויה בתקשורת עם השרת')
      const statusCode = error instanceof AxiosError && error.response?.status
        ? error.response.status
        : StatusCodes.INTERNAL_SERVER_ERROR
      return { success: false, message, data: null, statusCode }
    }
  }

  protected handle<TData>(
    response: IApiResponse<TData>,
    expected: StatusCodes = StatusCodes.OK,
  ): IProviderResult<TData> {
    if (response.statusCode !== expected) {
      return {
        success: false,
        message: response.message,
        data: null,
        statusCode: response.statusCode,
      }
    }
    return {
      success: true,
      message: response.message,
      data: response.data,
      statusCode: response.statusCode,
    }
  }
}

export class BaseCrudProvider<
  TEntity,
  TCreate = TEntity,
  TUpdate = TEntity,
  TGet = TEntity,
  TListArg = string[],
  TRepository extends {
    list(arg?: TListArg): Promise<IApiResponse<TEntity[]>>
    get(id: string): Promise<IApiResponse<TGet>>
    create(payload: TCreate): Promise<IApiResponse<TEntity>>
    update(id: string, payload: TUpdate): Promise<IApiResponse<TEntity>>
    delete(id: string): Promise<IApiResponse<boolean>>
  } = {
    list(arg?: TListArg): Promise<IApiResponse<TEntity[]>>
    get(id: string): Promise<IApiResponse<TGet>>
    create(payload: TCreate): Promise<IApiResponse<TEntity>>
    update(id: string, payload: TUpdate): Promise<IApiResponse<TEntity>>
    delete(id: string): Promise<IApiResponse<boolean>>
  },
> extends BaseProvider {
  constructor(protected readonly repository: TRepository) {
    super()
  }

  async list(arg?: TListArg): Promise<IProviderResult<TEntity[]>> {
    return this.safeCall(this.repository.list(arg))
  }

  async get(id: string): Promise<IProviderResult<TGet>> {
    return this.safeCall(this.repository.get(id))
  }

  async create(payload: TCreate): Promise<IProviderResult<TEntity>> {
    return this.safeCall(this.repository.create(payload), StatusCodes.CREATED)
  }

  async update(id: string, payload: TUpdate): Promise<IProviderResult<TEntity>> {
    return this.safeCall(this.repository.update(id, payload))
  }

  async delete(id: string): Promise<IProviderResult<boolean>> {
    return this.safeCall(this.repository.delete(id))
  }
}

export class BaseReceiptProvider<
  TEntity,
  TCreate = TEntity,
  TUpdate = TEntity,
  TGet = TEntity,
  TListArg = string[],
  TPresignData = {
    file: string
    sessionId: string
    id: string
    filename?: string
  },
  TRepository extends BaseReceiptRepository<
    TEntity,
    TCreate,
    TUpdate,
    TGet,
    TListArg,
    TPresignData
  > = BaseReceiptRepository<TEntity, TCreate, TUpdate, TGet, TListArg, TPresignData>,
> extends BaseCrudProvider<TEntity, TCreate, TUpdate, TGet, TListArg, TRepository> {
  async presign(data: TPresignData): Promise<IProviderResult<TEntity>> {
    return this.safeCall(this.repository.presign(data))
  }

  async unsign(id: string): Promise<IProviderResult<TEntity>> {
    return this.safeCall(this.repository.unsign(id))
  }
}
