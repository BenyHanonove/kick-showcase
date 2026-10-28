export interface IStatusMeta {
  label: string
  color: string
  icon: string
}

/**
 * Ready-to-use options for status select inputs
 */
export function buildStatusOptions<S extends string>(meta: Record<S, IStatusMeta>) {
  return (Object.entries(meta) as [S, IStatusMeta][]).map(([value, item]) => ({
    value,
    title: item.label,
    color: item.color,
    icon: item.icon,
  }))
}
