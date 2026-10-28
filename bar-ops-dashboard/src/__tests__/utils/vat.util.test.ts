import { describe, it, expect } from 'vitest'
import { addVat, removeVat, VAT_RATE, VAT_PERCENT } from '../../modules/shared/utils/vat.util'

describe('VAT Constants', () => {
  it('has correct rates', () => {
    expect(VAT_RATE).toBe(1.18)
    expect(VAT_PERCENT).toBe(18)
  })
})

describe('addVat', () => {
  it('correctly adds VAT and rounds to 2 decimal places', () => {
    expect(addVat(100)).toBe(118)
    expect(addVat(10)).toBe(11.8)
    expect(addVat(10.05)).toBe(11.86) // 10.05 * 1.18 = 11.859 -> 11.86
  })
})

describe('removeVat', () => {
  it('correctly removes VAT and rounds to 2 decimal places', () => {
    expect(removeVat(118)).toBe(100)
    expect(removeVat(11.8)).toBe(10)
    expect(removeVat(11.86)).toBe(10.05) // 11.86 / 1.18 = 10.0508... -> 10.05
  })
})
