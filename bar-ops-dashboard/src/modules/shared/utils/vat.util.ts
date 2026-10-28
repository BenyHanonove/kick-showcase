export const VAT_RATE = 1.18
export const VAT_PERCENT = 18

/**
 * Add VAT to net value
 */
export function addVat(net: number): number {
  return Number((net * VAT_RATE).toFixed(2))
}

/**
 * Remove VAT from gross value
 */
export function removeVat(gross: number): number {
  return Number((gross / VAT_RATE).toFixed(2))
}
