import { User, Mail, Phone, MapPin, Hash, Landmark } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { ShoppingQuoteClientDetail } from '@/types/shopping'

export interface QuoteClientCardProps {
  client: ShoppingQuoteClientDetail
  clientSectionTitle?: string
}

export function QuoteClientCard({ client, clientSectionTitle = 'Client' }: QuoteClientCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <CardHeader className="pb-3 bg-muted/30 border-b border-border/60">
        <CardTitle className="text-base flex items-center gap-2 font-semibold text-foreground">
          <User className="h-4 w-4 text-[#3d3d69] shrink-0" aria-hidden />
          {clientSectionTitle}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Coordonnées associées à la demande — vue synthèse
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            { key: 'name', label: 'Nom', value: client.name, icon: User },
            { key: 'email', label: 'E-mail', value: client.email, icon: Mail },
            { key: 'phone', label: 'Téléphone', value: client.phone, icon: Phone },
            { key: 'phone2', label: 'Téléphone secondaire', value: client.phoneSecondary, icon: Phone },
            { key: 'locker', label: 'Casier', value: client.lockerNumber, icon: Hash },
            { key: 'addr', label: 'Adresse', value: client.addressLine, icon: MapPin },
            { key: 'city', label: 'Code postal & ville', value: client.cityLine, icon: MapPin },
            { key: 'state', label: 'Région / province', value: client.state, icon: MapPin },
            { key: 'country', label: 'Pays', value: client.country, icon: MapPin },
            { key: 'landmark', label: 'Repère', value: client.landmark, icon: Landmark },
          ] as const
        ).map(({ key, label, value, icon: Icon }) => {
          const raw = value != null ? String(value).trim() : ''
          if (key !== 'name' && raw === '') return null
          const display = key === 'name' ? raw || '—' : raw
          return (
            <div key={key} className="flex items-start gap-3 text-sm min-w-0">
              <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold text-foreground break-words whitespace-pre-line leading-snug">{display}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
