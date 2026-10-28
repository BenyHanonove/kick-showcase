import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { IExpense, ICreateExpense, IUpdateExpense } from '@expense/types/IExpense.types'

export interface IExpenseFilters {
  sessionId: string
}

export interface IExpenseRepository {
  create(data: ICreateExpense): Promise<IApiResponse<IExpense>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IExpense>>
  list(filters: IExpenseFilters): Promise<IApiResponse<IExpense[]>>
  update(id: string, data: IUpdateExpense): Promise<IApiResponse<IExpense>>
  presign(data: {
    file: string
    sessionId: string
    id: string
    filename?: string
  }): Promise<IApiResponse<IExpense>>
  unsign(id: string): Promise<IApiResponse<IExpense>>
}
