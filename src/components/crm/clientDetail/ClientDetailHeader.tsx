import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Send, Inbox, ShoppingCart, CreditCard, Receipt,
  Calendar, Hash, Pencil,
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'
import { cn } from '@/lib/utils'
import type { ClientProfile } from '@/types/clientDetail'

function getRoleBadge(client: ClientProfile) {
  const isClient = client.is_client
  const isRecipient = client.is_recipient

  if (isClient && isRecipient) {
    return (
      <Badge variant="outline" className="text-xs border" style={{ backgroundColor: '#6366f118', color: '#6366f1', borderColor: '#6366f140' }}>
        Client & Destinataire
      </Badge>
    )
  }
  if (isClient) {
    return (
      <Badge variant="outline" className="text-xs border" style={{ backgroundColor: '#3b82f618', color: '#3b82f6', borderColor: '#3b82f640' }}>
        Client
      </Badge>
    )
  }
  if (isRecipient) {
    return (
      <Badge variant="outline" className="text-xs border" style={{ backgroundColor: '#8b5cf618', color: '#8b5cf6', borderColor: '#8b5cf640' }}>
        Destinataire
      </Badge>
    )
  }
  return null
}

export interface ClientDetailHeaderProps {
  client: ClientProfile
  sentCount: number
  receivedCount: number
  assistedPurchasesTotal: number
  totalSpentDisplay: string
  pendingAmountDisplay: string
  onOpenEdit: () => void
}

export function ClientDetailHeader({
  client,
  sentCount,
  receivedCount,
  assistedPurchasesTotal,
  totalSpentDisplay,
  pendingAmountDisplay,
  onOpenEdit,
}: ClientDetailHeaderProps) {
  const navigate = useNavigate()

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{displayLocalized(client.full_name)}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={client.is_active ? 'default' : 'secondary'}
                className={cn('text-xs', client.is_active ? 'bg-emerald-600 hover:bg-emerald-700' : '')}
              >
                {client.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              {getRoleBadge(client)}
              {client.has_account && (
                <Badge variant="outline" className="text-xs border" style={{ backgroundColor: '#10b98118', color: '#10b981', borderColor: '#10b98140' }}>
                  Compte portail
                </Badge>
              )}
              {client.locker_number && (
                <Badge variant="outline" className="font-mono text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  {client.locker_number}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Inscrit le {new Date(client.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button variant="outline" onClick={onOpenEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Modifier la fiche
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Send className="h-4 w-4 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{sentCount}</p>
                <p className="text-xs text-muted-foreground">Envoyées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg"><Inbox className="h-4 w-4 text-violet-600" /></div>
              <div>
                <p className="text-2xl font-bold">{receivedCount}</p>
                <p className="text-xs text-muted-foreground">Reçues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><ShoppingCart className="h-4 w-4 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{assistedPurchasesTotal}</p>
                <p className="text-xs text-muted-foreground">Achats assistés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CreditCard className="h-4 w-4 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{totalSpentDisplay}</p>
                <p className="text-xs text-muted-foreground">Total payé</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><Receipt className="h-4 w-4 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">{pendingAmountDisplay}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
