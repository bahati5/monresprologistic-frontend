import { Badge } from '@/components/ui/badge'
import { normalizeShipmentStatusCode } from '@/lib/shipmentDisplay'
import { statusBadgeStyle } from './clientDetailFormatters'

export function StatusBadge({ status, label }: { status: unknown; label: string }) {
  const code = normalizeShipmentStatusCode(status)
  const style = statusBadgeStyle(code)
  return (
    <Badge className="text-xs font-semibold px-2 py-0.5 border" style={style}>
      {label}
    </Badge>
  )
}
