export interface ICreateInterval {
  shiftId: string
  sessionId: string
  start?: string
  end?: string
}

export interface IUpdateInterval {
  id: string
  timestamp: string
  start?: string
  end?: string
}

export interface IInterval extends ICreateInterval {
  id: string
  timestamp: string
}
