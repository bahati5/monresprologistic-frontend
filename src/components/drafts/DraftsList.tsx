import { FileText, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAllDrafts } from '@/hooks/useDrafts'
import type { FormDraft, FormDraftType } from '@/hooks/useDrafts'

const FORM_TYPE_ROUTES: Record<FormDraftType, string> = {
  shipment: '/shipments/create',
  pre_alert: '/shipment-notices/create',
  assisted_purchase: '/shopping-assiste/nouveau',
  quote: '/purchase-orders',
  refund_request: '/finance/refunds',
  pickup: '/pickups',
}

function formatRelativeDate(iso: string): string {
  try {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return "Expire aujourd'hui"
    if (diffDays === 1) return 'Expire demain'
    return `Expire dans ${diffDays} jours`
  } catch {
    return ''
  }
}

function formatCreatedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    })
  } catch {
    return ''
  }
}

export function DraftsList() {
  const navigate = useNavigate()
  const { data: drafts, isLoading } = useAllDrafts()

  if (isLoading || !drafts || drafts.length === 0) return null

  const handleResume = (draft: FormDraft) => {
    const base = FORM_TYPE_ROUTES[draft.form_type] ?? '/'
    navigate(`${base}?draft_id=${draft.id}`)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Brouillons en cours ({drafts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {drafts.slice(0, 5).map((draft) => (
          <div
            key={draft.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {draft.form_type_label}
              </p>
              <p className="text-xs text-muted-foreground">
                Commencé le {formatCreatedDate(draft.created_at)}
                {' · '}
                {formatRelativeDate(draft.expires_at)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => handleResume(draft)}
            >
              Reprendre
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
