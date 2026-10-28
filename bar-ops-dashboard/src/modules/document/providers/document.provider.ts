// Import repository
import documentRepository from '@document/repository/document.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
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

// Extend base provider
export const documentProvider = new DocumentProvider(documentRepository)
