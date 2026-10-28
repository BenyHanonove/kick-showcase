import { createVuetify } from 'vuetify'
import type { ThemeDefinition } from 'vuetify'

import darkColors from './dark-colors'
import lightColors from './light-colors'
import Typography from './typography'
import { he } from 'vuetify/locale'

// Theme Schemes Definitions
const themes: Record<string, ThemeDefinition> = {
  dark: {
    dark: true,
    colors: darkColors,
  },
  light: {
    dark: false,
    colors: lightColors,
  },
}

// Vuetify Plugin Instance Configuration
export const vuetify = createVuetify({
  // Locale and RTL Settings
  locale: {
    locale: 'he',
    fallback: 'he',
    messages: { he },
    rtl: {
      he: true,
    },
  },
  // Theme Configuration
  theme: {
    defaultTheme: 'system',
    themes,
  },
  // Component Defaults Configuration
  defaults: {
    // Global Styles Defaults
    global: {
      style: `font-family: ${Typography.fontFamily};`,
    },

    // Button Defaults
    VBtn: {
      rounded: 'lg',
      style: `
        font-size: ${Typography.button.fontSize};
        font-weight: ${Typography.button.fontWeight};
        letter-spacing: ${Typography.button.letterSpacing};
        text-transform: ${Typography.button.textTransform};
      `,
    },

    // Uniform corner radius for all inputs (single source of truth)
    VTextField: { rounded: 'lg' },
    VTextarea: { rounded: 'lg' },
    VSelect: { rounded: 'lg' },
    VAutocomplete: { rounded: 'lg' },
    VCombobox: { rounded: 'lg' },
    VFileInput: { rounded: 'lg' },

    // Token-based card styling
    VCard: {
      rounded: 'lg',
      class: 'shadow-card',
      elevation: 1,
    },

    // Modal shadow
    VDialog: {
      class: 'shadow-popover',
    },

    // Comfortable density for tables
    VDataTable: {
      density: 'comfortable',
    },

    // Comfortable density for lists
    VList: {
      density: 'comfortable',
    },
  },
})
