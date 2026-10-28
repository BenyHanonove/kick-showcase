// Import types
import type { IConsume } from '@consume/types/IConsume.types'

// Fields needed for consumption calculation
type IConsumeQuantityFields = Pick<
  IConsume,
  'arrived' | 'fromStorage' | 'returnedToStorage' | 'creditedToSupplier'
>

// Consumed = received minus returns to supplier or storage
export function getConsumedQuantity(consume: IConsumeQuantityFields): number {
  return (
    (consume.arrived || 0) +
    (consume.fromStorage || 0) -
    (consume.returnedToStorage || 0) -
    (consume.creditedToSupplier || 0)
  )
}

// Charge = consumed quantity * chargedPrice
export function getConsumedCharge(
  consume: IConsumeQuantityFields & Pick<IConsume, 'chargedPrice'>,
): number {
  return getConsumedQuantity(consume) * (consume.chargedPrice ?? 0)
}
