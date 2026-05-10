import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MapPin, MoreHorizontal, Phone, Pencil, UserCheck, UserX } from 'lucide-react'
import type { NavigateFunction } from 'react-router-dom'
import { CountryNameWithFlag } from '@/components/CountryNameWithFlag'
import { displayLocalized } from '@/lib/localizedString'
import { clientCityDisplayString } from '@/components/crm/clients/clientDisplayHelpers'
import type { Client } from '@/types/crm'

type ClientCardEntry = Client & {
  company?: string | null
  address?: string | null
  is_recipient?: boolean
}

interface ClientGridCardProps {
  client: ClientCardEntry
  navigate: NavigateFunction
  onEdit: (c: ClientCardEntry) => void
  onToggleActive: (id: number) => void
}

export function ClientGridCard({ client: c, navigate, onEdit, onToggleActive }: ClientGridCardProps) {
  const countryEl =
    typeof c.country === 'object' && c.country && 'name' in c.country ? (
      <CountryNameWithFlag
        country={c.country as { id?: number; name: string; code?: string | null; iso2?: string | null; emoji?: string | null }}
        flagSize="sm"
      />
    ) : c.country ? (
      <span>{String(c.country)}</span>
    ) : null

  const head = [c.address ?? '', clientCityDisplayString(c)].filter(Boolean).join(', ')

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/clients/${c.id}`)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{displayLocalized(c.full_name ?? c.name)}</p>
            {c.company ? <p className="text-xs text-muted-foreground">{displayLocalized(c.company)}</p> : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(c)}>
                <Pencil size={14} className="mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleActive(c.id)}>
                {c.is_active ? (
                  <>
                    <UserX size={14} className="mr-2" />
                    Desactiver
                  </>
                ) : (
                  <>
                    <UserCheck size={14} className="mr-2" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {c.email ? (
          <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
            <Mail size={12} className="shrink-0" />
            {c.email}
          </p>
        ) : null}
        {c.phone ? (
          <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
            <Phone size={12} className="shrink-0" />
            {c.phone}
          </p>
        ) : null}
        {c.address || c.city || c.country ? (
          <p className="text-xs flex items-start gap-1.5 text-muted-foreground">
            <MapPin size={12} className="shrink-0 mt-0.5" />
            <span className="inline-flex flex-wrap items-center gap-x-1">
              {head}
              {head && countryEl ? <span aria-hidden>, </span> : null}
              {countryEl}
            </span>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {c.locker_number ? (
            <Badge variant="outline" className="text-xs font-mono">
              Locker {c.locker_number}
            </Badge>
          ) : null}
          <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-xs">
            {c.is_active ? 'Actif' : 'Inactif'}
          </Badge>
          {(c.is_client || c.has_shipments_as_sender) && (c.is_recipient || c.has_shipments_as_recipient) ? (
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              Client & Destinataire
            </Badge>
          ) : c.is_client || c.has_shipments_as_sender ? (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Client
            </Badge>
          ) : c.is_recipient || c.has_shipments_as_recipient ? (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              Destinataire
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
