import { describe, it, expect } from 'vitest'
import {
  formatPhoneNumber,
  formatNumber,
  formatCurrency,
  compactCurrency,
  formatDate,
} from '../../modules/shared/utils/formatters.util'

describe('formatPhoneNumber', () => {
  it('formats standard phone numbers', () => {
    expect(formatPhoneNumber('0521234567')).toBe('052-1234567')
  })

  it('returns dash for falsy values', () => {
    expect(formatPhoneNumber('')).toBe('—')
    expect(formatPhoneNumber(undefined)).toBe('—')
  })
})

describe('formatNumber', () => {
  it('formats numbers to IL format', () => {
    expect(formatNumber(1234.567)).toBe('1,234.57')
    expect(formatNumber(0)).toBe('0.00')
  })

  it('handles null/undefined/NaN', () => {
    expect(formatNumber(null)).toBe('0.00')
    expect(formatNumber(undefined)).toBe('0.00')
    expect(formatNumber(NaN)).toBe('0.00')
  })
})

describe('formatCurrency', () => {
  it('formats numbers with shekel prefix', () => {
    expect(formatCurrency(1234.5)).toBe('₪1,234.50')
  })
})

describe('compactCurrency', () => {
  it('compacts large values', () => {
    expect(compactCurrency(1500)).toBe('₪1.5K')
    expect(compactCurrency(1000000)).toBe('₪1M')
    expect(compactCurrency(1234567)).toBe('₪1.2M')
    expect(compactCurrency(150)).toBe('₪150.00')
  })
})

describe('formatDate', () => {
  it('formats dates in Hebrew locale', () => {
    const dateStr = '2026-07-16T12:00:00Z'
    // In he-IL, default formatting for 2026-07-16 would be "16.7.2026"
    expect(formatDate(dateStr)).toContain('16.7.2026')
  })

  it('handles empty or invalid dates', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('invalid-date')).toBe('—')
  })
})
