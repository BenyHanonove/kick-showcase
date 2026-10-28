export enum CashierLocation {
  BAR = 'bar',
  TABLES = 'tables',
}

export const CashierLocationLabels: Record<CashierLocation, string> = {
  [CashierLocation.BAR]: 'בר',
  [CashierLocation.TABLES]: 'שולחנות',
}
