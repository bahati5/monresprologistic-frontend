import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientAddressBookEntry } from '@/types/clientDetail'

export interface ClientDetailContactsTabProps {
  addressBookEntries: { data: ClientAddressBookEntry[]; meta: { total: number } }
}

export function ClientDetailContactsTab({ addressBookEntries }: ClientDetailContactsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" /> Contacts enregistrés (Carnet d'adresses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {addressBookEntries?.data?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addressBookEntries.data.map((entry) => {
              const contactId = entry.contact_profile_id || entry.contactProfile?.id
              const inner = (
                <div className={cn(
                  'p-3 rounded-lg border',
                  contactId ? 'hover:bg-muted/50 cursor-pointer transition-colors' : ''
                )}>
                  <p className="font-medium">{entry.contactProfile?.full_name || entry.alias || 'Contact'}</p>
                  {entry.contactProfile?.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" /> {entry.contactProfile.email}
                    </p>
                  )}
                  {entry.contactProfile?.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {entry.contactProfile.phone}
                    </p>
                  )}
                  {entry.is_default && (
                    <Badge variant="outline" className="text-xs mt-2">Par défaut</Badge>
                  )}
                </div>
              )

              if (contactId) {
                return (
                  <Link key={entry.id} to={`/clients/${contactId}`}>
                    {inner}
                  </Link>
                )
              }
              return <div key={entry.id}>{inner}</div>
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun contact enregistré</p>
        )}
      </CardContent>
    </Card>
  )
}
