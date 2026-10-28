// Backend API response contract
export interface IApiResponse<TData> {
  data: TData
  statusCode: number
  message: string
}

// Raw axios response body
export interface IRawResponse<TData> {
  data?: TData | Record<string, TData>
  message?: string
}
