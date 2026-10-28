import type { IFormField, FormValue } from '../types/IForm.types'

// Bidi/directional marks that clipboards (e.g. RTL contact apps) wrap around pasted text
const BIDI_CONTROL_CHARS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g

// Build API payload dynamically
export const buildPayload = (
  fields: IFormField[],
  form: Record<string, FormValue>,
): Record<string, FormValue> => {
  const payload: Record<string, FormValue> = {}

  // Copy all form keys, stripping bidi marks and trimming strings
  for (const [key, rawValue] of Object.entries(form)) {
    const value = typeof rawValue === 'string' ? rawValue.replace(BIDI_CONTROL_CHARS, '').trim() : rawValue
    if (value === '') {
      payload[key] = undefined
    } else {
      payload[key] = value
    }
  }

  // Coerce types on defined fields
  for (const field of fields) {
    const value = payload[field.key]
    if (value === undefined) continue

    if (field.type === 'number') {
      payload[field.key] = value !== null && value !== '' ? Number(value) || 0 : 0
    } else if (value === '') {
      payload[field.key] = undefined
    }
  }

  return payload
}
