export enum ExpensePaidBy {
  TIPS = 'tips',
  CLIENT = 'client',
  HOUSE = 'house',
}

export const ExpensePaidByLabels: Record<ExpensePaidBy, string> = {
  [ExpensePaidBy.HOUSE]: 'בית',
  [ExpensePaidBy.TIPS]: 'טיפים',
  [ExpensePaidBy.CLIENT]: 'לקוח',
}
