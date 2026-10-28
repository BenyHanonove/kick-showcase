import { describe, it, expect } from 'vitest'
import { getConsumedQuantity, getConsumedCharge } from '@consume/composables/consume.calc'

describe('getConsumedQuantity', () => {
  it('calculates consumption with all fields present', () => {
    expect(
      getConsumedQuantity({
        arrived: 10,
        fromStorage: 5,
        returnedToStorage: 1,
        creditedToSupplier: 2,
      }),
    ).toBe(12)
  })

  it('treats missing fromStorage as zero', () => {
    expect(
      getConsumedQuantity({
        arrived: 10,
        fromStorage: undefined,
        returnedToStorage: 1,
        creditedToSupplier: 2,
      }),
    ).toBe(7)
  })

  it('allows a negative result when leftovers exceed what arrived', () => {
    expect(
      getConsumedQuantity({
        arrived: 5,
        fromStorage: 0,
        returnedToStorage: 4,
        creditedToSupplier: 4,
      }),
    ).toBe(-3)
  })

  it('matches the values used across consume/session summary cards', () => {
    expect(
      getConsumedQuantity({
        arrived: 20,
        fromStorage: 3,
        returnedToStorage: 2,
        creditedToSupplier: 1,
      }),
    ).toBe(20)
  })
})

describe('getConsumedCharge', () => {
  it('multiplies consumed quantity by chargedPrice', () => {
    expect(
      getConsumedCharge({
        arrived: 10,
        fromStorage: 0,
        returnedToStorage: 2,
        creditedToSupplier: 0,
        chargedPrice: 5,
      }),
    ).toBe(40)
  })

  it('treats missing chargedPrice as zero', () => {
    expect(
      getConsumedCharge({
        arrived: 10,
        fromStorage: 0,
        returnedToStorage: 0,
        creditedToSupplier: 0,
        chargedPrice: undefined,
      }),
    ).toBe(0)
  })
})
