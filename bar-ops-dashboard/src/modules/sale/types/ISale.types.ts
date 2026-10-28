export interface ISale extends ICreateSale {
  id: string
  paid: boolean
  timestamp: string
}

export interface ICreateSale {
  clientId: string
  datetime: string
  name: string
}

export interface ISaleSummary extends ISale {
  costPrice: number
  soldPrice: number
}

export interface IUpdateSale {
  id: string
  timestamp: string
  clientId?: string
  datetime?: string
  name?: string
  paid?: boolean
}
