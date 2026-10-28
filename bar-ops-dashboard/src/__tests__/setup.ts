import { config } from '@vue/test-utils'
import { vuetify } from '../config/theme'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@assets/styles/tokens.css'
import '@assets/styles/global.css'

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

import AppButton from '../modules/shared/components/layout/AppButton.vue'
import AppListItem from '../modules/shared/components/layout/AppListItem.vue'
import AppList from '../modules/shared/components/layout/AppList.vue'

// Mock visualViewport for jsdom (Vuetify overlay positioning)
global.visualViewport ??= new EventTarget() as unknown as VisualViewport

config.global.plugins = [vuetify]
config.global.components = {
  ...config.global.components,
  AppButton,
  AppListItem,
  AppList,
}

// Set CSS custom properties on document root for test environment
const root = document.documentElement

// Spacing tokens
root.style.setProperty('--bo-space-xs', '4px')
root.style.setProperty('--bo-space-sm', '8px')
root.style.setProperty('--bo-space-md', '16px')
root.style.setProperty('--bo-space-lg', '24px')
root.style.setProperty('--bo-space-xl', '32px')
root.style.setProperty('--bo-space-2xl', '48px')

// Card padding variants
root.style.setProperty('--bo-card-padding-compact', '12px')
root.style.setProperty('--bo-card-padding-normal', '16px')
root.style.setProperty('--bo-card-padding-spacious', '24px')

// Responsive gap tokens
root.style.setProperty('--bo-gap-mobile', '8px')
root.style.setProperty('--bo-gap-tablet', '16px')
root.style.setProperty('--bo-gap-desktop', '24px')

// Radius tokens
root.style.setProperty('--bo-radius-sm', '10px')
root.style.setProperty('--bo-radius-md', '14px')
root.style.setProperty('--bo-radius-lg', '20px')
root.style.setProperty('--bo-radius-xl', '28px')
root.style.setProperty('--bo-radius-tight', '6px')
root.style.setProperty('--bo-radius-loose', '32px')

// Shadow tokens
root.style.setProperty('--bo-shadow-card', '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)')
root.style.setProperty('--bo-shadow-raised', '0 2px 6px rgba(15, 23, 42, 0.06), 0 12px 28px rgba(15, 23, 42, 0.1)')
root.style.setProperty('--bo-shadow-popover', '0 4px 12px rgba(15, 23, 42, 0.1), 0 20px 48px rgba(15, 23, 42, 0.16)')
root.style.setProperty('--bo-shadow-hover', '0 4px 8px rgba(15, 23, 42, 0.08)')
root.style.setProperty('--bo-shadow-drag', '0 8px 16px rgba(15, 23, 42, 0.12)')
root.style.setProperty('--bo-shadow-focused', '0 0 0 4px rgba(192, 105, 77, 0.1)')

// Transition tokens
root.style.setProperty('--bo-transition-fast', '150ms ease')
root.style.setProperty('--bo-transition-normal', '250ms ease-in-out')
root.style.setProperty('--bo-transition-slow', '400ms ease-out')

// Elevation tokens
root.style.setProperty('--bo-elevation-base', '0')
root.style.setProperty('--bo-elevation-raised', '1')
root.style.setProperty('--bo-elevation-floating', '2')
root.style.setProperty('--bo-elevation-modal', '3')
root.style.setProperty('--bo-elevation-tooltip', '4')

// Font family
root.style.setProperty('--bo-font-sans', "'Assistant', 'Heebo', system-ui, -apple-system, sans-serif")

// CSS utility classes (jsdom workaround - CSS file doesn't load in tests)
const styleElement = document.createElement('style')
styleElement.textContent = `
  .shadow-card { box-shadow: var(--bo-shadow-card); }
  .shadow-raised { box-shadow: var(--bo-shadow-raised); }
  .shadow-popover { box-shadow: var(--bo-shadow-popover); }
  .shadow-hover { box-shadow: var(--bo-shadow-hover); }
  .shadow-drag { box-shadow: var(--bo-shadow-drag); }
  .shadow-focused { box-shadow: var(--bo-shadow-focused); }
  .transition-fast { transition: var(--bo-transition-fast); }
  .transition-normal { transition: var(--bo-transition-normal); }
  .transition-slow { transition: var(--bo-transition-slow); }
`
document.head.appendChild(styleElement)
