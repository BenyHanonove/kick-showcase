// Import axios response types
import type { AxiosResponse } from 'axios'

// Import custom api client
import api from './api'

// Import file parser utilities
import { parseBlobResponse } from '../utils/parseBlobResponse.util'

// Import global response types
import type { IApiResponse, IRawResponse } from '@shared/types/IApiResponse.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

// Define query parameter interface structure
export interface IQueryParams {
  [key: string]: string | number | boolean | (string | number | boolean)[] | null | undefined
}

export class BaseRepository<
  TEntity,
  TCreate = TEntity,
  TUpdate = TEntity,
  TGet = TEntity,
  TListArg = string[],
> {
  constructor(
    protected readonly endpoint: string,
    protected readonly pluralKey: string,
    protected readonly singularKey: string,
  ) {}

  private buildPath(ids: string[]): string {
    return ids.length > 0 ? `${this.endpoint}/${ids.join('/')}` : this.endpoint
  }

  protected wrap<TData>(
    response: AxiosResponse<IRawResponse<TData>>,
    key: string,
    fallback: TData,
  ): IApiResponse<TData> {
    const body = response.data
    const payload = (body?.data ?? body) as Record<string, TData>
    const data: TData = (payload?.[key] as TData) ?? (body?.data as TData) ?? fallback
    return {
      data,
      statusCode: response.status,
      message: body?.message ?? '',
    }
  }

  async list(arg?: TListArg): Promise<IApiResponse<TEntity[]>> {
    // Parse list arguments for request
    let ids: string[] = []
    let params: IQueryParams | undefined = undefined

    if (Array.isArray(arg)) {
      ids = arg as object as string[]
    } else if (arg && typeof arg === 'object') {
      params = arg as object as IQueryParams
    }

    const response = await api.get<IRawResponse<TEntity[]>>(this.buildPath(ids), { params })
    return this.wrap<TEntity[]>(response, this.pluralKey, [])
  }

  async get(id: string): Promise<IApiResponse<TGet>> {
    const response = await api.get<IRawResponse<TGet>>(`${this.endpoint}/${id}`)
    return this.wrap<TGet>(response, this.singularKey, {} as TGet)
  }

  async create(payload: TCreate): Promise<IApiResponse<TEntity>> {
    const response = await api.post<IRawResponse<TEntity>>(this.endpoint, payload)
    return this.wrap<TEntity>(response, this.singularKey, {} as TEntity)
  }

  async update(id: string, payload: TUpdate): Promise<IApiResponse<TEntity>> {
    const response = await api.put<IRawResponse<TEntity>>(`${this.endpoint}/${id}`, payload)
    return this.wrap<TEntity>(response, this.singularKey, {} as TEntity)
  }

  async delete(id: string): Promise<IApiResponse<boolean>> {
    const response = await api.delete<IRawResponse<boolean>>(`${this.endpoint}/${id}`)
    return {
      data: response.status >= 200 && response.status < 300,
      statusCode: response.status,
      message: response.data?.message ?? '',
    }
  }

  // Download blob summary report
  protected async downloadBlob(
    path: string,
    fileName: string,
    params?: IQueryParams,
  ): Promise<ISummaryReport> {
    const response = await api.get(path, {
      params,
      responseType: 'blob',
    })
    return parseBlobResponse(response, fileName)
  }
}

export class BaseReceiptRepository<
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
> extends BaseRepository<TEntity, TCreate, TUpdate, TGet, TListArg> {
  async presign(data: TPresignData): Promise<IApiResponse<TEntity>> {
    const response = await api.post<IRawResponse<TEntity>>(`${this.endpoint}/presign`, data)
    return this.wrap<TEntity>(response, this.singularKey, {} as TEntity)
  }

  async unsign(id: string): Promise<IApiResponse<TEntity>> {
    const response = await api.post<IRawResponse<TEntity>>(`${this.endpoint}/unsign`, { id })
    return this.wrap<TEntity>(response, this.singularKey, {} as TEntity)
  }
}
