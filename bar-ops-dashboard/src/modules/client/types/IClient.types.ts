export interface ICreateClient {
  name: string
  brand: string
  email?: string
  phone: string
}

export interface IUpdateClient {
  id: string
  timestamp: string
  name?: string
  brand?: string
  email?: string
  phone?: string
}

export interface IClient extends ICreateClient {
  id: string
  timestamp: string
}
