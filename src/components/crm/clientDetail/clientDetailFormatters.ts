import { STATUS_COLORS } from '@/lib/animations'

export function statusBadgeStyle(statusCode: string) {
  const hex = STATUS_COLORS[statusCode]
  if (hex) {
    return {
      backgroundColor: hex + '18',
      color: hex,
      borderColor: hex + '40',
    }
  }
  return {
    backgroundColor: '#6366f118',
    color: '#6366f1',
    borderColor: '#6366f140',
  }
}

export function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    relative: getRelativeTime(d),
  }
}

function getRelativeTime(date: Date) {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
