import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CorridorFlags } from '@/lib/countryFlags'
import { displayLocalized } from '@/lib/localizedString'
import { paymentStatusBadge } from '@/lib/shipmentDetailWorkflow'

type PayBadge = ReturnType<typeof paymentStatusBadge>

export interface ShipmentDetailHeaderProps {
  shipmentId: string | undefined
  trackingNumber: string | undefined
  statusName: string
  statusColor: string
  payBadge: PayBadge
  hasSignedForm: boolean | undefined
  createdAt: string | undefined
  shippingMode: string | null | undefined
  driverName: string | null | undefined
  routeDisplay: string | null | undefined
  corridor:
    | {
        origin_iso2?: string | null
        dest_iso2?: string | null
        origin_country?: string | null
        dest_country?: string | null
      }
    | null
    | undefined
}

export function ShipmentDetailHeader({
  shipmentId,
  trackingNumber,
  statusName,
  statusColor,
  payBadge,
  hasSignedForm,
  createdAt,
  shippingMode,
  driverName,
  corridor,
}: ShipmentDetailHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Back + Tracking + Badges + Route */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
          {trackingNumber || `EXP-${shipmentId}`}
        </h1>
        <Badge
          className="text-[11px] font-semibold px-2 py-0.5"
          style={{
            backgroundColor: statusColor + '18',
            color: statusColor,
            borderColor: statusColor + '30',
            border: `1px solid ${statusColor}30`,
          }}
        >
          {statusName}
        </Badge>
        <Badge className="text-[11px] font-semibold px-2 py-0.5" style={payBadge.style}>
          {payBadge.label}
        </Badge>
        {hasSignedForm ? (
          <Badge variant="outline" className="text-[11px] px-2 py-0.5">
            Formulaire signé
          </Badge>
        ) : null}

        {/* Separator + meta */}
        <span className="hidden md:inline text-muted-foreground/40">|</span>
        <span className="text-xs text-muted-foreground hidden md:inline">
          {createdAt
            ? new Date(createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
            : ''}
        </span>
        {shippingMode && <span className="text-xs text-muted-foreground hidden md:inline">&middot; {shippingMode}</span>}
        {driverName && <span className="text-xs text-muted-foreground hidden lg:inline">&middot; {displayLocalized(driverName)}</span>}

        {corridor && (
          <>
            <span className="hidden md:inline text-muted-foreground/40">|</span>
            <CorridorFlags
              originIso2={corridor.origin_iso2}
              destIso2={corridor.dest_iso2}
              originLabel={corridor.origin_country}
              destLabel={corridor.dest_country}
            />
          </>
        )}
      </div>
    </div>
  )
}
