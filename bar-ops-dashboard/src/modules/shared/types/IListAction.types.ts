// Single action rendered inside AppList
export interface IListAction {
  title: string
  icon?: string
  color?: string
  disabled?: boolean
  loading?: boolean
  handler: () => void
}
