export interface ICreateDocument {
  sessionId: string
  name: string
  contentType: string
  file: string
  desc?: string
}

export interface IUpdateDocument {
  id: string
  timestamp: string
  name?: string
  desc?: string
}

export interface IDocument {
  id: string
  sessionId: string
  name: string
  contentType: string
  size: number
  key: string
  url?: string
  desc?: string
  timestamp: string
}
