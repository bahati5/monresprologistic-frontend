import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Pencil, UserCheck, UserX } from 'lucide-react'
import type { NavigateFunction } from 'react-router-dom'
import { displayLocalized } from '@/lib/localizedString'
import type { Client } from '@/types/crm'

type ClientListEntry = Client & {
  company?: string | null
  is_recipient?: boolean
}

interface ClientListRowProps {
  client: ClientListEntry
  navigate: NavigateFunction
  onEdit: (c: ClientListEntry) => void
  onToggleActive: (id: number) => void
}

export function ClientListRow({ client: c, navigate, onEdit, onToggleActive }: ClientListRowProps) {
  return (
    <tr
      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => navigate(`/clients/${c.id}`)}
    >
      <td className="px-4 py-3">
        <p className="font-medium">{displayLocalized(c.full_name ?? c.name)}</p>
        {c.company && <p className="text-xs text-muted-foreground">{displayLocalized(c.company)}</p>}
      </td>
      <td className="px-4 py-3 text-sm">{c.email || '-'}</td>
      <td className="px-4 py-3 text-sm">{c.phone || '-'}</td>
      <td className="px-4 py-3">
        {c.locker_number ? (
          <Badge variant="outline" className="text-xs font-mono">
            {c.locker_number}
          </Badge>
        ) : (
          '-'
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-xs">
            {c.is_active ? 'Actif' : 'Inactif'}
          </Badge>
          {(c.is_client || c.has_shipments_as_sender) && c.has_shipments_as_recipient ? (
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              Client & Destinataire
            </Badge>
          ) : c.is_client || c.has_shipments_as_sender ? (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Client
            </Badge>
          ) : c.has_shipments_as_recipient ? (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              Destinataire
            </Badge>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
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
      </td>
    </tr>
  )
}
