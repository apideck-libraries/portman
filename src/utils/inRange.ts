export const inRange = (num: number, rangeStart: number, rangeEnd = 0): boolean => {
  return (rangeStart <= num && num <= rangeEnd) || (rangeEnd <= num && num <= rangeStart)
}
