import { User, Mail, Phone, MapPin, Hash, Landmark } from 'lucide-react'

import type { ShoppingQuoteClientDetail } from '@/types/shopping'

export interface QuoteClientCardProps {
  client: ShoppingQuoteClientDetail
  clientSectionTitle?: string
}

const CLIENT_FIELDS = [
  { key: 'name', label: 'Nom', icon: User },
  { key: 'email', label: 'E-mail', icon: Mail },
  { key: 'phone', label: 'Téléphone', icon: Phone },
  { key: 'phone2', label: 'Tél. secondaire', icon: Phone },
  { key: 'locker', label: 'Casier', icon: Hash },
  { key: 'addr', label: 'Adresse', icon: MapPin },
  { key: 'city', label: 'CP & ville', icon: MapPin },
  { key: 'state', label: 'Région', icon: MapPin },
  { key: 'country', label: 'Pays', icon: MapPin },
  { key: 'landmark', label: 'Repère', icon: Landmark },
] as const

type ClientFieldKey = (typeof CLIENT_FIELDS)[number]['key']

const CLIENT_VALUE_MAP: Record<ClientFieldKey, keyof ShoppingQuoteClientDetail> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  phone2: 'phoneSecondary',
  locker: 'lockerNumber',
  addr: 'addressLine',
  city: 'cityLine',
  state: 'state',
  country: 'country',
  landmark: 'landmark',
}

export function QuoteClientCard({ client, clientSectionTitle = 'Client' }: QuoteClientCardProps) {
  return (
    <div className="glass neo-raised-sm rounded-xl p-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <div className="p-1.5 bg-[#073763]/5 rounded-lg">
          <User size={14} className="text-[#073763]" />
        </div>
        {clientSectionTitle}
      </h2>

      <div className="space-y-2">
        {CLIENT_FIELDS.map(({ key, label, icon: Icon }) => {
          const raw = client[CLIENT_VALUE_MAP[key]]
          const display = raw != null ? String(raw).trim() : ''
          if (key !== 'name' && display === '') return null
          return (
            <div key={key} className="flex items-start gap-2 text-xs min-w-0">
              <Icon size={13} className="mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="font-medium text-foreground break-words leading-snug">{display || '—'}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
