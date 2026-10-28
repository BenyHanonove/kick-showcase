// Design tokens; mirrored in src/assets/styles/tokens.css

// Spacing scale (px). 4px base rhythm.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  // Card padding semantic variants
  cardCompact: 12,
  cardNormal: 16,
  cardSpacious: 24,
  // Responsive breakpoint tokens
  mobileGap: 8,
  tabletGap: 16,
  desktopGap: 24,
}

// Corner radius scale (px). Rounded, modern-SaaS feel.
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  // Semantic radius variants
  tight: 6,
  loose: 32,
}

// Soft, layered shadows for a light-mode-first surface system.
export const shadow = {
  card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
  raised: '0 2px 6px rgba(15, 23, 42, 0.06), 0 12px 28px rgba(15, 23, 42, 0.10)',
  popover: '0 4px 12px rgba(15, 23, 42, 0.10), 0 20px 48px rgba(15, 23, 42, 0.16)',
  // Interactive state shadows
  hover: '0 4px 8px rgba(15, 23, 42, 0.08)',
  dragActive: '0 8px 16px rgba(15, 23, 42, 0.12)',
  focused: '0 0 0 4px rgba(192, 105, 77, 0.1)',
}

// Type scale consumed by the Vuetify typography config.
export const typeScale = {
  h1: { fontSize: '2.5rem', fontWeight: 300, lineHeight: 1.2, letterSpacing: '-0.01562em' },
  h2: { fontSize: '2rem', fontWeight: 300, lineHeight: 1.25, letterSpacing: '-0.00833em' },
  h3: { fontSize: '1.5rem', fontWeight: 500, lineHeight: 1.3, letterSpacing: '0' },
  h4: { fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.35, letterSpacing: '0.00735em' },
  body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5, letterSpacing: '0.03125em' },
  body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.45, letterSpacing: '0.01786em' },
  caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4, letterSpacing: '0.03333em' },
}

// Transition timing values for consistent animation durations.
export const transition = {
  fast: '150ms ease',
  normal: '250ms ease-in-out',
  slow: '400ms ease-out',
}

// Elevation levels for semantic layer ordering.
export const elevation = {
  base: 0,
  raised: 1,
  floating: 2,
  modal: 3,
  tooltip: 4,
}

export default { spacing, radius, shadow, typeScale, transition, elevation }
