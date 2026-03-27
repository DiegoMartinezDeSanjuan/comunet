import 'server-only'

export function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return Number.parseFloat(value)
  }

  if (value && typeof value === 'object' && 'toNumber' in value) {
    const candidate = value as { toNumber?: () => number }
    if (typeof candidate.toNumber === 'function') {
      return candidate.toNumber()
    }
  }

  return Number(value ?? 0)
}

export function buildMonthRange(period: string | null | undefined): { start: Date; end: Date } | null {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return null
  }

  const [yearText, monthText] = period.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null
  }

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999))

  return { start, end }
}

export function getUniqueValues(values: string[]): string[] {
  return Array.from(new Set(values))
}
