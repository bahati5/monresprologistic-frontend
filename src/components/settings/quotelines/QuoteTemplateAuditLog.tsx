import { useQuery } from '@tanstack/react-query'
import { History, User, Clock, Pencil, Plus, Trash2, Loader2 } from 'lucide-react'
import api from '@/api/client'
import { Badge } from '@/components/ui/badge'

interface AuditEntry {
  id: number
  entity_type: 'quote_line_template' | 'quote_template'
  entity_id: number
  entity_name: string
  action: 'created' | 'updated' | 'deleted' | 'reordered'
  changes: Record<string, { from: unknown; to: unknown }> | null
  performed_by_name: string
  performed_at: string
}

function actionIcon(action: AuditEntry['action']) {
  switch (action) {
    case 'created':
      return <Plus size={11} className="text-green-600" />
    case 'updated':
      return <Pencil size={11} className="text-blue-600" />
    case 'deleted':
      return <Trash2 size={11} className="text-red-600" />
    case 'reordered':
      return <History size={11} className="text-purple-600" />
  }
}

function actionLabel(action: AuditEntry['action']): string {
  switch (action) {
    case 'created': return 'Créé'
    case 'updated': return 'Modifié'
    case 'deleted': return 'Supprimé'
    case 'reordered': return 'Réordonné'
  }
}

function actionColor(action: AuditEntry['action']): string {
  switch (action) {
    case 'created': return 'bg-green-50 text-green-700 border-green-200'
    case 'updated': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'deleted': return 'bg-red-50 text-red-700 border-red-200'
    case 'reordered': return 'bg-purple-50 text-purple-700 border-purple-200'
  }
}

function ChangeDetails({ changes }: { changes: Record<string, { from: unknown; to: unknown }> }) {
  const entries = Object.entries(changes)
  if (entries.length === 0) return null

  return (
    <div className="mt-1.5 space-y-0.5">
      {entries.map(([field, { from, to }]) => (
        <div key={field} className="flex items-center gap-1 text-[10px]">
          <span className="text-muted-foreground font-medium">{field}:</span>
          <span className="line-through text-muted-foreground">
            {from != null ? String(from) : '(vide)'}
          </span>
          <span className="text-foreground">→</span>
          <span className="font-medium">{to != null ? String(to) : '(vide)'}</span>
        </div>
      ))}
    </div>
  )
}

export default function QuoteTemplateAuditLog() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['settings', 'quote-templates-audit'],
    queryFn: () =>
      api
        .get<{ entries: AuditEntry[] }>('/api/settings/quote-templates/audit-log')
        .then((r) => r.data.entries),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History size={14} className="text-[#073763]" />
        <h3 className="text-sm font-semibold">Historique des modifications</h3>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Journal complet des modifications sur les lignes de frais et templates de devis
      </p>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <History size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Aucune modification enregistrée</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-3 bg-background hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="mt-0.5">{actionIcon(entry.action)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${actionColor(entry.action)}`}>
                        {actionLabel(entry.action)}
                      </Badge>
                      <span className="text-xs font-medium truncate">{entry.entity_name}</span>
                      <Badge variant="secondary" className="text-[9px]">
                        {entry.entity_type === 'quote_line_template' ? 'Ligne' : 'Template'}
                      </Badge>
                    </div>
                    {entry.changes && entry.action === 'updated' && (
                      <ChangeDetails changes={entry.changes} />
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <User size={9} />
                    <span>{entry.performed_by_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock size={9} />
                    <span>
                      {new Date(entry.performed_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
