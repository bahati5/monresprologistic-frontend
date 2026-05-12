import { motion } from 'framer-motion'

import { fadeInUp } from '@/lib/animations'
import { resolveLocalized } from '@/lib/localizedString'
import { InfoRow } from '@/components/shipments/detail/InfoRow'
import type { Shipment } from '@/types/shipment'
import { Package, MapPin, User, Phone, Mail, Calendar, Weight, Ruler, Coins, Truck } from 'lucide-react'

export function ShipmentDetailInfoGrid({ shipment: s }: { shipment: Shipment }) {
  return (
    <motion.div variants={fadeInUp} className="space-y-3">
      {/* Expediteur */}
      <div className="glass neo-raised-sm rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/30">
          <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center">
            <User size={12} className="text-blue-600" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Expediteur</h3>
        </div>
        <div className="space-y-0.5">
          <InfoRow icon={User} label="Nom" value={resolveLocalized(s.sender_name || s.client?.name) || undefined} />
          <InfoRow icon={Mail} label="Email" value={s.sender_email || s.client?.email} />
          <InfoRow icon={Phone} label="Tél" value={s.sender_phone} />
          <InfoRow icon={MapPin} label="Adresse" value={s.sender_address} />
          <InfoRow icon={MapPin} label="Ville" value={resolveLocalized(s.sender_city) || undefined} />
          <InfoRow icon={MapPin} label="Région" value={resolveLocalized(s.sender_state) || undefined} />
          <InfoRow icon={MapPin} label="Pays" value={resolveLocalized(s.sender_country) || undefined} />
          <InfoRow icon={MapPin} label="Code postal" value={s.sender_zip_code} />
        </div>
      </div>

      {/* Destinataire */}
      <div className="glass neo-raised-sm rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/30">
          <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <MapPin size={12} className="text-emerald-600" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Destinataire</h3>
        </div>
        <div className="space-y-0.5">
          <InfoRow icon={User} label="Nom" value={resolveLocalized(s.recipient_name) || undefined} />
          <InfoRow icon={Mail} label="Email" value={s.recipient_email} />
          <InfoRow icon={Phone} label="Tél" value={s.recipient_phone} />
          <InfoRow icon={MapPin} label="Adresse" value={s.recipient_address} />
          <InfoRow icon={MapPin} label="Ville" value={resolveLocalized(s.recipient_city) || undefined} />
          <InfoRow icon={MapPin} label="Région" value={resolveLocalized(s.recipient_state) || undefined} />
          <InfoRow icon={MapPin} label="Pays" value={resolveLocalized(s.recipient_country) || undefined} />
          <InfoRow icon={MapPin} label="Code postal" value={s.recipient_zip_code} />
        </div>
      </div>

      {/* Details expedition */}
      <div className="glass neo-raised-sm rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/30">
          <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Package size={12} className="text-amber-600" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Expedition</h3>
        </div>
        <div className="space-y-0.5">
          <InfoRow icon={Truck} label="Mode" value={s.shipping_mode} />
          <InfoRow icon={Package} label="Emballage" value={s.packaging_type} />
          <InfoRow icon={Weight} label="Poids" value={s.total_weight ? `${s.total_weight} kg` : undefined} />
          <InfoRow icon={Ruler} label="Volume" value={s.total_volume ? `${s.total_volume} cm³` : undefined} />
          <InfoRow icon={Coins} label="Valeur" value={s.declared_value ? `${s.declared_value}` : undefined} />
          <InfoRow
            icon={Calendar}
            label="Livraison"
            value={s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString('fr-FR') : undefined}
          />
        </div>
      </div>
    </motion.div>
  )
}
