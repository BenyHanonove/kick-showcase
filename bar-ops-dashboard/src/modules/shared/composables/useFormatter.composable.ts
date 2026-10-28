export const useFormatter = () => {
  const formatShiftTiming = (timing: string | Date | undefined | null): string => {
    if (!timing) return ''

    const date = new Date(timing)
    if (isNaN(date.getTime())) return ''

    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')

    const time = date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    return `${day}/${month} ${time}`
  }

  const calculateDiffInHours = (startIso?: string, endIso?: string): number => {
    if (!startIso || !endIso) return 0

    const startDate = new Date(startIso)
    const endDate = new Date(endIso)

    const diffMs = endDate.getTime() - startDate.getTime()

    if (diffMs < 0) return 0

    const diffHours = diffMs / (1000 * 60 * 60)

    return Math.round(diffHours * 100) / 100
  }

  const sortArrayByTitle = <T>(titleKey: keyof T, arr: T[]): T[] => {
    if (!arr || !Array.isArray(arr)) return []

    return [...arr].sort((a, b) => {
      const valA = String(a[titleKey] || '')
      const valB = String(b[titleKey] || '')

      return valA.localeCompare(valB, 'he')
    })
  }

  return {
    formatShiftTiming,
    calculateDiffInHours,
    sortArrayByTitle,
  }
}
