// Define product type enum
export enum ProductType {
  ALCOHOL = 'alcohol',
  SODA = 'soda',
  ENERGY_DRINK = 'energy_drink',
  EQUIPMENT = 'equipment',
  DISPOSABLE = 'disposable',
  ACCOMPANYING = 'accompanying',
}

// Define product type translation labels
export const ProductTypeLabels: Record<ProductType, string> = {
  [ProductType.ALCOHOL]: 'אלכוהול',
  [ProductType.SODA]: 'שתייה קלה',
  [ProductType.ENERGY_DRINK]: 'משקה אנרגיה',
  [ProductType.EQUIPMENT]: 'ציוד',
  [ProductType.DISPOSABLE]: 'חד-פעמי',
  [ProductType.ACCOMPANYING]: 'נלווה',
}
