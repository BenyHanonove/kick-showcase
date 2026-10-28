import { BaseRepository } from '@shared/repository/base.repository'

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
