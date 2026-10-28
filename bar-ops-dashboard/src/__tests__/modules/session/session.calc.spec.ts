import { describe, it, expect } from 'vitest'
import {
  getGrossSales,
  getOperationalCost,
  getNetProfit,
  getPayrollCost,
  getLaborCostRatio,
} from '@session/composables/session.calc'
import { ExpensePaidBy } from '@expense/types/PaidBy.types'

describe('getGrossSales', () => {
  it('sums cash + credit - creditTip across multiple cashiers', () => {
    expect(
      getGrossSales([
        { cash: 100, credit: 50, creditTip: 5 },
        { cash: 200, credit: 0, creditTip: 0 },
      ]),
    ).toBe(345)
  })

  it('treats missing fields as zero', () => {
    expect(getGrossSales([{ cash: 100, credit: 0, creditTip: 0 }])).toBe(100)
  })

  it('returns 0 for an empty list', () => {
    expect(getGrossSales([])).toBe(0)
  })
})

describe('getOperationalCost', () => {
  it('sums VAT-adjusted consume charge and only CLIENT-paid expenses', () => {
    const consumes = [
      { arrived: 10, fromStorage: 0, returnedToStorage: 0, creditedToSupplier: 0, chargedPrice: 5 },
    ]
    const expenses = [
      { amount: 20, paidBy: ExpensePaidBy.CLIENT },
      { amount: 30, paidBy: ExpensePaidBy.HOUSE },
    ]
    // consumeChargedSum = 10 * 5 = 50; clientExpensesSum = 20; (50 + 20) * 1.18 = 82.6
    expect(getOperationalCost(consumes, expenses)).toBeCloseTo(82.6)
  })

  it('excludes expenses without paidBy === CLIENT', () => {
    const consumes: Parameters<typeof getOperationalCost>[0] = []
    const expenses = [{ amount: 100, paidBy: ExpensePaidBy.TIPS }]
    expect(getOperationalCost(consumes, expenses)).toBe(0)
  })

  it('composes the full getConsumedCharge formula (fromStorage, returnedToStorage, creditedToSupplier all non-zero)', () => {
    const consumes = [
      {
        arrived: 20,
        fromStorage: 3,
        returnedToStorage: 2,
        creditedToSupplier: 1,
        chargedPrice: 5,
      },
    ]
    // quantity = 20 + 3 - 2 - 1 = 20; charge = 20 * 5 = 100; (100 + 0) * 1.18 = 118
    expect(getOperationalCost(consumes, [])).toBeCloseTo(118)
  })
})

describe('getNetProfit', () => {
  it('composes gross sales minus operational cost', () => {
    const cashiers = [{ cash: 200, credit: 0, creditTip: 0 }]
    const consumes = [
      { arrived: 10, fromStorage: 0, returnedToStorage: 0, creditedToSupplier: 0, chargedPrice: 5 },
    ]
    const expenses = [{ amount: 20, paidBy: ExpensePaidBy.CLIENT }]
    // gross = 200; cost = (50 + 20) * 1.18 = 82.6; net = 117.4
    expect(getNetProfit(cashiers, consumes, expenses)).toBeCloseTo(117.4)
  })
})

describe('getPayrollCost', () => {
  it('sums wage cost (hourly * totalHours) and all bonuses across shifts', () => {
    const shifts = [
      { hourly: 50, totalHours: 4, bonusTravel: 10, bonusManage: 0, bonusSetup: 5, bonusOther: 0 },
      { hourly: 40, totalHours: 3, bonusTravel: 0, bonusManage: 20, bonusSetup: 0, bonusOther: 0 },
    ]
    // shift1 = 50*4 + 10 + 5 = 215; shift2 = 40*3 + 20 = 140; total = 355
    expect(getPayrollCost(shifts)).toBe(355)
  })

  it('treats a null hourly rate as 0 wage cost while still counting bonuses', () => {
    const shifts = [
      {
        hourly: null,
        totalHours: 5,
        bonusTravel: 15,
        bonusManage: 0,
        bonusSetup: 0,
        bonusOther: 0,
      },
    ]
    expect(getPayrollCost(shifts)).toBe(15)
  })

  it('returns 0 for an empty list', () => {
    expect(getPayrollCost([])).toBe(0)
  })
})

describe('getLaborCostRatio', () => {
  it('composes payroll cost / gross sales as a percentage', () => {
    const shifts = [
      { hourly: 50, totalHours: 4, bonusTravel: 0, bonusManage: 0, bonusSetup: 0, bonusOther: 0 },
    ]
    const cashiers = [{ cash: 1000, credit: 0, creditTip: 0 }]
    // payroll = 200; gross = 1000; ratio = 20%
    expect(getLaborCostRatio(shifts, cashiers)).toBeCloseTo(20)
  })

  it('returns 0 when gross sales is 0, avoiding division by zero', () => {
    const shifts = [
      { hourly: 50, totalHours: 4, bonusTravel: 0, bonusManage: 0, bonusSetup: 0, bonusOther: 0 },
    ]
    const cashiers: Parameters<typeof getLaborCostRatio>[1] = []
    expect(getLaborCostRatio(shifts, cashiers)).toBe(0)
  })
})
