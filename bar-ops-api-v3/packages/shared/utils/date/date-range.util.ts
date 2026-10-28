export interface MonthDayBucket {
  monthYear: string;
  dayStart: number;
  dayEnd: number;
}

// Splits a YYYY-MM-DD start/end range into per-month (monthYear, day BETWEEN) buckets
// so a date range can be queried as one Query
export const getDateRangeBuckets = (startDate: string, endDate: string): MonthDayBucket[] => {
  const buckets: MonthDayBucket[] = [];
  const startMonthYear = startDate.slice(0, 7);
  const endMonthYear = endDate.slice(0, 7);
  const startDay = Number(startDate.slice(8, 10));
  const endDay = Number(endDate.slice(8, 10));

  let year = Number(startDate.slice(0, 4));
  let month = Number(startDate.slice(5, 7));
  const finalYear = Number(endDate.slice(0, 4));
  const finalMonth = Number(endDate.slice(5, 7));

  while (year < finalYear || (year === finalYear && month <= finalMonth)) {
    const monthYear = `${year}-${String(month).padStart(2, '0')}`;
    buckets.push({
      monthYear,
      dayStart: monthYear === startMonthYear ? startDay : 1,
      dayEnd: monthYear === endMonthYear ? endDay : 31,
    });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return buckets;
};
