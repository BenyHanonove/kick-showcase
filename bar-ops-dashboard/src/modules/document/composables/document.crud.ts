// Import stores
import { SessionStore, SnackbarStore } from '@stores'

// Import providers
import { documentProvider } from '@document/providers/document.provider'

// Import composables
import { useCrud } from '@shared/composables/crud.composable'

// Import utils
import { rules } from '@shared/utils/rules.util'

// Import types
import type { IDocument, ICreateDocument, IUpdateDocument } from '@document/types/IDocument.types'
import type { IFormField } from '@shared/types/IForm.types'

// Read a File as a base64 data URL
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

// Export document crud composable
export const useDocumentCrud = () => {
  const store = SessionStore()
  const snackbarStore = SnackbarStore()
  const crud = useCrud<IDocument, ICreateDocument, IUpdateDocument>(documentProvider, store.documents)

  // Create only asks for a description — name is taken from the picked file itself,
  // who uploaded it is captured server-side from the Cognito identity
  const documentCreateFields: IFormField[] = [
    {
      key: 'desc',
      label: 'תיאור (אופציונלי)',
      type: 'textarea',
    },
  ]

  // Once uploaded, the display name (decoupled from the S3 key) can be renamed
  const documentUpdateFields: IFormField[] = [
    {
      key: 'name',
      label: 'שם הקובץ*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'desc',
      label: 'תיאור (אופציונלי)',
      type: 'textarea',
    },
  ]

  const documentInitialState = (sessionId: string) => ({
    sessionId,
    desc: '',
  })

  // Convert the picked file to base64 and create the document entity
  const handleUpload = async (file: File, meta: { sessionId: string; desc?: string }) => {
    try {
      const base64 = await fileToBase64(file)
      const payload: ICreateDocument = {
        sessionId: meta.sessionId,
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        file: base64,
        desc: meta.desc,
      }
      return await crud.handleCreate(payload)
    } catch {
      snackbarStore.open('שגיאה בקריאת הקובץ', 'error')
      return null
    }
  }

  return {
    ...crud,
    documentCreateFields,
    documentUpdateFields,
    documentInitialState,
    handleUpload,
  }
}
