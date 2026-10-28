import type { SummaryFormat } from '@shared/types/ISummaryMetric.types'

/**
 * Format phone number to standard display format with hyphens (e.g. 052-1234567)
 */
export function formatPhoneNumber(phone?: string): string {
  if (!phone) return '—'
  return phone.replace(/(\d{3})(\d+)/, '$1-$2')
}

/**
 * Format number with he-IL locale formatting
 */
export function formatNumber(value: number | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return (0).toFixed(fractionDigits)
  }
  return Number(value.toFixed(fractionDigits)).toLocaleString('he-IL', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/**
 * Format currency with ₪ prefix and he-IL locale formatting
 */
export function formatCurrency(value: number | null | undefined, fractionDigits = 2): string {
  return `₪${formatNumber(value, fractionDigits)}`
}

/**
 * Compact currency representation (e.g. ₪1.2K, ₪1.5M)
 */
export function compactCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    return `₪${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (abs >= 1_000) {
    return `₪${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return formatCurrency(value, 2)
}

/**
 * Render a summary figure according to its declared format
 */
export function formatSummaryValue(value: number, format: SummaryFormat = 'currency'): string {
  if (format === 'percent') return `${formatNumber(value, 0)}%`
  if (format === 'number') return formatNumber(value, 0)
  return formatCurrency(value)
}

/**
 * Format date to Hebrew locale (he-IL)
 */
export function formatDate(
  value: string | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('he-IL', opts)
}

/**
 * Generate standard WhatsApp message/chat URL for a given phone number
 */
export function getWhatsAppUrl(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    return `https://wa.me/972${cleanPhone.slice(1)}`
  }
  return `https://wa.me/${cleanPhone}`
}

