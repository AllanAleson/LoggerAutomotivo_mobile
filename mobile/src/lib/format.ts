const pad = (value: number) => String(value).padStart(2, '0')

export function parseDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// Formatação manual (dd/mm/aaaa hh:mm:ss) para não depender do suporte a Intl de cada motor JS.
export function formatDateTime(value?: string | null, fallback = 'Sem comunicação') {
  const date = parseDate(value)
  if (!date) return fallback
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatDateTimeShort(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatTime(value: number | Date) {
  const date = typeof value === 'number' ? new Date(value) : value
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function timeAgo(value?: string | null, now = Date.now()) {
  const date = parseDate(value)
  if (!date) return null
  const seconds = Math.round((now - date.getTime()) / 1000)
  if (seconds < 45) return 'agora'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.round(hours / 24)
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
}

export function formatVoltage(value?: number | null) {
  return value == null ? '—' : `${value.toFixed(1).replace('.', ',')} V`
}

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

// O firmware do ESP32 envia campos opcionais como string vazia ("expected": "").
export function textOr(value: string | number | null | undefined, fallback: string) {
  return value == null || String(value).trim() === '' ? fallback : String(value)
}

export function orDash(value?: string | number | null) {
  return textOr(value, '—')
}
