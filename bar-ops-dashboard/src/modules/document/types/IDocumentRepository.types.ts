import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { IDocument, ICreateDocument, IUpdateDocument } from '@document/types/IDocument.types'

export interface IDocumentFilters {
  sessionId: string
}

export interface IDocumentRepository {
  create(data: ICreateDocument): Promise<IApiResponse<IDocument>>
  list(filters: IDocumentFilters): Promise<IApiResponse<IDocument[]>>
  get(id: string): Promise<IApiResponse<IDocument>>
  update(id: string, data: IUpdateDocument): Promise<IApiResponse<IDocument>>
  delete(id: string): Promise<IApiResponse<boolean>>
}
