import { format, parseISO } from 'date-fns'

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd HH:mm')
  } catch {
    return dateStr
  }
}

export function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'MM/dd HH:mm')
  } catch {
    return dateStr
  }
}
