import { typeScale } from './tokens'

// Assistant font: clean, elegant, full Hebrew support
const PRIMARY_FONT_FAMILY = "'Assistant', 'Heebo', system-ui, -apple-system, sans-serif"

// Typography System Configuration
const Typography = {
  // Base Font Family
  fontFamily: PRIMARY_FONT_FAMILY,

  // Type scale (sourced from design tokens)
  scale: typeScale,

  // Button Typography — elegant, not "office": no uppercase, lighter weight
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: 'normal',
    textTransform: 'none',
  },
}

export default Typography
