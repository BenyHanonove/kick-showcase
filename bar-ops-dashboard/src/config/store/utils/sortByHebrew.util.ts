// Hebrew locale comparator
export const sortByHebrew =
  <T>(getLabel: (item: T) => string) =>
  (a: T, b: T) =>
    getLabel(a).localeCompare(getLabel(b), 'he')
