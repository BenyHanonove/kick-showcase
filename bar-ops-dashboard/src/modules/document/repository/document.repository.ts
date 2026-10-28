// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

// Import types
import type { IDocument, ICreateDocument, IUpdateDocument } from '@document/types/IDocument.types'
import type { IDocumentFilters, IDocumentRepository } from '@document/types/IDocumentRepository.types'

class DocumentRepository
  extends BaseRepository<IDocument, ICreateDocument, IUpdateDocument, IDocument, IDocumentFilters>
  implements IDocumentRepository
{
  constructor() {
    super('/document', 'documents', 'document')
  }
}

const documentRepository = new DocumentRepository()

export default documentRepository
