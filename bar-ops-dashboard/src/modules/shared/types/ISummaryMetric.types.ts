// Semantic role of a summary figure. Maps to a Vuetify theme color, never a raw hex.
export type SummaryTone = 'positive' | 'negative' | 'net' | 'neutral'

// How a raw numeric value is rendered by the summary layer.
export type SummaryFormat = 'currency' | 'number' | 'percent'

export interface ISummaryMetric {
  key: string
  label: string
  // Terser label for the collapsed glance row; falls back to `label`.
  shortLabel?: string
  value: number
  icon: string
  tone: SummaryTone
  format?: SummaryFormat
  caption?: string
}

// A column in a summary breakdown table.
export interface ISummaryColumn {
  key: string
  label: string
  align?: 'start' | 'center' | 'end'
  format?: SummaryFormat
  tone?: SummaryTone
}

// A breakdown row; `values` is keyed by ISummaryColumn.key.
export interface ISummaryRow {
  key: string
  label: string
  icon?: string
  iconColor?: string
  values: Record<string, number>
}

// Fixed tone mappings. 'net' is sign-dependent and resolved separately below.
const TONE_COLORS: Record<Exclude<SummaryTone, 'net'>, string> = {
  positive: 'success',
  negative: 'error',
  neutral: 'info',
}

// A net figure reads success in the black and error in the red.
export function resolveTone(tone: SummaryTone, value = 0): string {
  if (tone === 'net') return value >= 0 ? 'success' : 'error'
  return TONE_COLORS[tone]
}
