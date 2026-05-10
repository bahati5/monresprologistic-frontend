import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeInUp } from '@/lib/animations'
import { resolveLocalized } from '@/lib/localizedString'
import { InfoRow } from '@/components/shipments/detail/InfoRow'
import type { Shipment } from '@/types/shipment'
import { Package, MapPin, User, Phone, Mail, Calendar, Weight, Ruler, DollarSign, Truck } from 'lucide-react'

export function ShipmentDetailInfoGrid({ shipment: s }: { shipment: Shipment }) {
  return (
    <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User size={14} className="text-blue-500" /> Expediteur
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <InfoRow icon={User} label="Nom complet" value={resolveLocalized(s.sender_name || s.client?.name) || undefined} />
          <InfoRow icon={Mail} label="Email" value={s.sender_email || s.client?.email} />
          <InfoRow icon={Phone} label="Téléphone" value={s.sender_phone} />
          <InfoRow icon={Phone} label="Téléphone secondaire" value={s.sender_phone_secondary} />
          <InfoRow icon={MapPin} label="Adresse" value={s.sender_address} />
          <InfoRow icon={MapPin} label="Point de repère" value={s.sender_landmark} />
          <InfoRow icon={MapPin} label="Code postal" value={s.sender_zip_code} />
          <InfoRow icon={MapPin} label="Ville" value={resolveLocalized(s.sender_city) || undefined} />
          <InfoRow icon={MapPin} label="Région / État" value={resolveLocalized(s.sender_state) || undefined} />
          <InfoRow icon={MapPin} label="Pays" value={resolveLocalized(s.sender_country) || undefined} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin size={14} className="text-emerald-500" /> Destinataire
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <InfoRow icon={User} label="Nom complet" value={resolveLocalized(s.recipient_name) || undefined} />
          <InfoRow icon={Mail} label="Email" value={s.recipient_email} />
          <InfoRow icon={Phone} label="Téléphone" value={s.recipient_phone} />
          <InfoRow icon={Phone} label="Téléphone secondaire" value={s.recipient_phone_secondary} />
          <InfoRow icon={MapPin} label="Adresse" value={s.recipient_address} />
          <InfoRow icon={MapPin} label="Point de repère" value={s.recipient_landmark} />
          <InfoRow icon={MapPin} label="Code postal" value={s.recipient_zip_code} />
          <InfoRow icon={MapPin} label="Ville" value={resolveLocalized(s.recipient_city) || undefined} />
          <InfoRow icon={MapPin} label="Région / État" value={resolveLocalized(s.recipient_state) || undefined} />
          <InfoRow icon={MapPin} label="Pays" value={resolveLocalized(s.recipient_country) || undefined} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package size={14} className="text-amber-500" /> Details expedition
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <InfoRow icon={Truck} label="Mode" value={s.shipping_mode} />
          <InfoRow icon={Package} label="Emballage" value={s.packaging_type} />
          <InfoRow icon={Weight} label="Poids total" value={s.total_weight ? `${s.total_weight} kg` : undefined} />
          <InfoRow icon={Ruler} label="Volume" value={s.total_volume ? `${s.total_volume} cm³` : undefined} />
          <InfoRow icon={DollarSign} label="Valeur declaree" value={s.declared_value ? `${s.declared_value}` : undefined} />
          <InfoRow
            icon={Calendar}
            label="Livraison estimee"
            value={s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString('fr-FR') : undefined}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
