import { describe, it, expect } from 'vitest'

import { vuetify } from '../config/theme'
import lightColors from '../config/theme/light-colors'
import darkColors from '../config/theme/dark-colors'

// Semantic color keys every theme must define
const REQUIRED_COLOR_KEYS = [
  'background',
  'surface',
  'primary',
  'primary-soft',
  'secondary',
  'error',
  'info',
  'success',
  'warning',
  'outline',
]

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

describe('Theme System Validation', () => {
  describe('Light and dark theme definitions', () => {
    it('registers both light and dark themes on the vuetify instance', () => {
      const themes = vuetify.theme.themes.value
      expect(themes).toHaveProperty('light')
      expect(themes).toHaveProperty('dark')
    })

    it('flags light as non-dark and dark as dark', () => {
      const themes = vuetify.theme.themes.value
      expect(themes.light?.dark).toBe(false)
      expect(themes.dark?.dark).toBe(true)
    })

    it('defines all required semantic color keys in both themes', () => {
      for (const key of REQUIRED_COLOR_KEYS) {
        expect(lightColors, `light missing "${key}"`).toHaveProperty(key)
        expect(darkColors, `dark missing "${key}"`).toHaveProperty(key)
      }
    })

    it('has full key parity between light and dark color sets', () => {
      expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort())
    })

    it('uses valid hex color values in both themes', () => {
      for (const [key, value] of Object.entries(lightColors)) {
        expect(value, `light "${key}" is not a hex color`).toMatch(HEX_COLOR)
      }
      for (const [key, value] of Object.entries(darkColors)) {
        expect(value, `dark "${key}" is not a hex color`).toMatch(HEX_COLOR)
      }
    })

    it('resolves theme colors through the vuetify instance', () => {
      const themes = vuetify.theme.themes.value
      for (const key of REQUIRED_COLOR_KEYS) {
        expect(themes.light?.colors, `resolved light missing "${key}"`).toHaveProperty(key)
        expect(themes.dark?.colors, `resolved dark missing "${key}"`).toHaveProperty(key)
      }
    })

    it('falls back to light when system theme preference is unavailable', () => {
      // JSDOM lacks matchMedia; catch branch must resolve to 'light'
      const current = vuetify.theme.global.name.value
      expect(current).toBe('light')
    })
  })

  describe('RTL (Hebrew) layout configuration', () => {
    it('uses Hebrew as the current locale', () => {
      expect(vuetify.locale.current.value).toBe('he')
    })

    it('resolves the app as right-to-left', () => {
      expect(vuetify.locale.isRtl.value).toBe(true)
    })

    it('declares dir=rtl and lang=he on the document root (index.html)', async () => {
      // Validate the shipped markup, not jsdom's default
      const raw = await import('../../index.html?raw')
      expect(raw.default).toMatch(/<html[^>]*dir="rtl"/)
      expect(raw.default).toMatch(/<html[^>]*lang="he"/)
    })
  })
})
