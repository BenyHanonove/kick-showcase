import type { AxiosResponse } from 'axios'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

// Parse blob response and extract filename from content-disposition
export const parseBlobResponse = (
  response: AxiosResponse,
  fallbackName: string,
): ISummaryReport => {
  const contentDisposition = response.headers['content-disposition']
  let fileName = fallbackName

  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]+)['"]?/)
    if (match?.[1]) {
      fileName = decodeURIComponent(match[1])
    }
  }

  return {
    blob: response.data,
    fileName,
  }
}
