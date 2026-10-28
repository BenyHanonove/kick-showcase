export type FormFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'date'
  | 'datetime-local'
  | 'switch'
  | 'circle-toggle'
  | 'timing'
  | 'list-select'

export type Primitive = string | number | boolean | null | undefined

export type FormValue =
  | Primitive
  | Date
  | Primitive[]
  | Record<string, Primitive | Record<string, Primitive>>

export type ValidationRule = (v: Primitive | Primitive[]) => string | boolean

export interface ISelectItem {
  title: string
  value: FormValue
  [key: string]: FormValue
}
export interface IFormField {
  key: string
  label: string
  type: FormFieldType
  items?: (ISelectItem | string | number)[]
  rules?: ValidationRule[]
  cols?: number | string
  props?: Record<string, Primitive | Record<string, Primitive>>
  hidden?: boolean
}
