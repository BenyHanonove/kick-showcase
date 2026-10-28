import documentRepository from '@document/repository/document.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type { IDocument, ICreateDocument, IUpdateDocument } from '@document/types/IDocument.types'
import type { IDocumentFilters } from '@document/types/IDocumentRepository.types'

class DocumentProvider extends BaseCrudProvider<
  IDocument,
  ICreateDocument,
  IUpdateDocument,
  IDocument,
  IDocumentFilters,
  typeof documentRepository
> {}

export const documentProvider = new DocumentProvider(documentRepository)
