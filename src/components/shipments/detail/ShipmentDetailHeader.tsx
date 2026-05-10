import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CorridorFlags } from '@/lib/countryFlags'
import { displayLocalized } from '@/lib/localizedString'
import { fadeInUp } from '@/lib/animations'
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
  routeDisplay,
  corridor,
}: ShipmentDetailHeaderProps) {
  const navigate = useNavigate()

  return (
    <motion.div variants={fadeInUp} className="flex items-center gap-4">
      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
      </Button>
      <div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            {trackingNumber || `EXP-${shipmentId}`}
          </h1>
          <Badge
            className="text-xs font-semibold px-2.5 py-0.5 border"
            style={{
              backgroundColor: statusColor + '20',
              color: statusColor,
              borderColor: statusColor + '40',
            }}
          >
            {statusName}
          </Badge>
          <Badge className="text-xs font-semibold px-2.5 py-0.5 border" style={payBadge.style}>
            {payBadge.label}
          </Badge>
          {hasSignedForm ? (
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
              Formulaire signe archive
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Creee le{' '}
          {createdAt
            ? new Date(createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '-'}
          {shippingMode && <> &middot; {shippingMode}</>}
          {driverName && <> &middot; Chauffeur: {displayLocalized(driverName)}</>}
        </p>
        {routeDisplay || corridor ? (
          <div className="mt-2 space-y-1.5">
            <p className="text-sm text-muted-foreground">Itinéraire</p>
            <div className="shrink-0">
              <CorridorFlags
                originIso2={corridor?.origin_iso2}
                destIso2={corridor?.dest_iso2}
                originLabel={corridor?.origin_country}
                destLabel={corridor?.dest_country}
              />
            </div>
            {routeDisplay ? (
              <p className="text-sm leading-relaxed text-foreground/90 break-words">{routeDisplay}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
