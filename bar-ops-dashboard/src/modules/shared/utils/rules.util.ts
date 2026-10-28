// Form validation rules
export const rules = {
  required:
    (message = 'חובה') =>
    (v: unknown) => {
      if (v === null || v === undefined || v === '') return message
      if (Array.isArray(v) && v.length === 0) return message
      return true
    },

  minNumber:
    (min: number, message = 'חובה') =>
    (v: unknown) => {
      if (v === null || v === undefined || v === '') return message
      const val = Number(v)
      return (!isNaN(val) && val >= min) || message
    },

  greaterThan:
    (min: number, message = `חייב להיות גדול מ-${min}`) =>
    (v: unknown) => {
      if (v === null || v === undefined || v === '') return message
      const val = Number(v)
      return (!isNaN(val) && val > min) || message
    },

  between:
    (min: number, max: number, message = `חייב להיות בין ${min} ל-${max}`) =>
    (v: unknown) => {
      if (v === null || v === undefined || v === '') return message
      const val = Number(v)
      return (!isNaN(val) && val >= min && val <= max) || message
    },

  regex: (pattern: RegExp, message: string) => (v: unknown) => {
    if (v === null || v === undefined || v === '') return true
    return pattern.test(String(v)) || message
  },

  israeliId: (message = 'תעודת זהות חייבת להכיל 9 ספרות בדיוק') =>
    rules.regex(/^[0-9]{9}$/, message),

  phone:
    (message = 'מספר טלפון לא תקין') =>
    (v: unknown) => {
      if (v === null || v === undefined || v === '') return true
      // Strip formatting (dashes, spaces) so display-formatted numbers like
      // "052-1234567" validate against the digits-only pattern.
      return /^0[0-9]{8,9}$/.test(String(v).replace(/\D/g, '')) || message
    },

  israeliPhone: (message = 'מספר טלפון לא תקין') =>
    rules.phone(message),

  instagramHandle: (message = 'שם המשתמש אינו תקין') =>
    rules.regex(/^@?[a-zA-Z0-9._]{1,30}$/, message),

  email: (message = 'כתובת אימייל לא תקינה') =>
    rules.regex(/.+@.+\..+/, message),
}
