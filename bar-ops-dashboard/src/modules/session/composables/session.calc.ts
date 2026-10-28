// Import types
import type { ICashier } from '@cashier/types/ICashier.types'
import type { IExpense } from '@expense/types/IExpense.types'
import type { IConsume } from '@consume/types/IConsume.types'
import type { IShift } from '@shift/types/IShift.types'
// Import shared consume calculation
import { getConsumedCharge } from '@consume/composables/consume.calc'
import { ExpensePaidBy } from '@expense/types/PaidBy.types'
import { VAT_RATE } from '@shared/utils/vat.util'

// Cashier fields needed for gross sales calculation
type ICashierRevenueFields = Pick<ICashier, 'cash' | 'credit' | 'creditTip'>

// Expense fields needed for operational cost calculation
type IExpenseCostFields = Pick<IExpense, 'amount' | 'paidBy'>

// Consume fields needed for operational cost calculation
type IConsumeChargeFields = Pick<
  IConsume,
  'arrived' | 'fromStorage' | 'returnedToStorage' | 'creditedToSupplier' | 'chargedPrice'
>

// Shift fields needed for payroll cost calculation
type IShiftPayrollFields = Pick<
  IShift,
  'hourly' | 'totalHours' | 'bonusTravel' | 'bonusManage' | 'bonusSetup' | 'bonusOther'
>

// Gross sales = cash + credit - creditTip, across session
export function getGrossSales(cashiers: ICashierRevenueFields[]): number {
  return cashiers.reduce((sum, c) => sum + (c.cash || 0) + (c.credit || 0) - (c.creditTip || 0), 0)
}

// Operational cost = VAT-adjusted consumption charge + client expenses
export function getOperationalCost(
  consumes: IConsumeChargeFields[],
  expenses: IExpenseCostFields[],
): number {
  const consumeChargedSum = consumes.reduce((sum, c) => sum + getConsumedCharge(c), 0)
  const clientExpensesSum = expenses
    .filter((e) => e.paidBy === ExpensePaidBy.CLIENT)
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  return (consumeChargedSum + clientExpensesSum) * VAT_RATE
}

// Net profit = gross sales - operational cost
export function getNetProfit(
  cashiers: ICashierRevenueFields[],
  consumes: IConsumeChargeFields[],
  expenses: IExpenseCostFields[],
): number {
  return getGrossSales(cashiers) - getOperationalCost(consumes, expenses)
}

// Payroll cost = wage cost + bonus payouts, across shifts
export function getPayrollCost(shifts: IShiftPayrollFields[]): number {
  return shifts.reduce((sum, s) => {
    const wage = (s.hourly || 0) * (s.totalHours || 0)
    const bonuses =
      (s.bonusTravel || 0) + (s.bonusManage || 0) + (s.bonusSetup || 0) + (s.bonusOther || 0)
    return sum + wage + bonuses
  }, 0)
}

// Labor cost ratio = payroll cost / gross sales
export function getLaborCostRatio(
  shifts: IShiftPayrollFields[],
  cashiers: ICashierRevenueFields[],
): number {
  const gross = getGrossSales(cashiers)
  return gross > 0 ? (getPayrollCost(shifts) / gross) * 100 : 0
}
