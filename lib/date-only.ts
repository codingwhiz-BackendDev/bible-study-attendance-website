const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function normalizeIsoDate(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!ISO_DATE_PATTERN.test(raw)) return null
  const [year, month, day] = raw.split('-').map(Number)
  if (!year || !month || !day) return null
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12))
  const iso = `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}-${String(utcDate.getUTCDate()).padStart(2, '0')}`
  return iso === raw ? raw : null
}

export function isSundayIsoDate(value: string) {
  const normalized = normalizeIsoDate(value)
  if (!normalized) return false
  const [year, month, day] = normalized.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay() === 0
}

export function addDaysToIsoDate(value: string, offset: number) {
  const normalized = normalizeIsoDate(value)
  if (!normalized) return value
  const [year, month, day] = normalized.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + offset, 12))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
}

export function lagosDateIso(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  if (!year || !month || !day) return '1970-01-01'
  return `${year}-${month}-${day}`
}
