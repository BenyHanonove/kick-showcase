import type { ValidationRule, Primitive } from './IForm.types';

export type InputType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'date'
  | 'datetime-local'
  | 'tel'
  | 'url'
  | 'month'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'textarea'
  | 'file'
  | 'autocomplete';

export type InputVariant = 'outlined' | 'filled' | 'solo';
export type InputSize = 'compact' | 'normal' | 'spacious';

export type ModelValueType =
  | Primitive
  | File
  | File[]
  | Record<string, unknown>
  | Primitive[]
  | (Primitive | Record<string, unknown>)[];

export interface AppInputProps {
  type: InputType;
  modelValue?: ModelValueType;
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  items?: (Record<string, unknown> | string | number)[];
  multiple?: boolean;
  rows?: number;
  itemTitle?:
    | string
    | ((
        item: Record<string, unknown> | string | number | null | undefined
      ) => string | number | boolean);
  itemValue?: string;
  rules?: ValidationRule[];
}
