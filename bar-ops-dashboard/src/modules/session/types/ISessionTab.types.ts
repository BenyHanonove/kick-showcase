export interface ISessionTab {
  id:
    | 'shifts'
    | 'vehicles'
    | 'cashier'
    | 'products'
    | 'equipment'
    | 'expenses'
    | 'tips'
    | 'missions'
    | 'envelopes'
    | 'documents'
  title: string
  icon: string
}
