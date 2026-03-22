/**
 * Formatters for Spanish locale (es-ES)
 * All dates dd/MM/yyyy, currency EUR, timezone Europe/Madrid
 */

const LOCALE = 'es-ES'
const TIMEZONE = 'Europe/Madrid'

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, { timeZone: TIMEZONE })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(LOCALE, { timeZone: TIMEZONE })
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'EUR',
  }).format(num)
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(num / 100)
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat(LOCALE).format(num)
}
