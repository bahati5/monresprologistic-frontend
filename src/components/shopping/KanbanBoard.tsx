import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type KanbanStatus =
  | 'pending_quote'
  | 'quoted'
  | 'awaiting_payment'
  | 'paid'
  | 'ordered'
  | 'arrived_at_hub'
  | 'converted_to_shipment'
  | 'expired'
  | 'failed'
  | 'cancelled'

export interface KanbanPurchaseCard {
  id: number
  status: KanbanStatus
  article_label?: string | null
  product_url?: string | null
  created_at?: string
  user?: { id: number; name?: string | null } | null
}

interface KanbanBoardProps {
  cards: KanbanPurchaseCard[]
  isStaff: boolean
  onMove: (cardId: number, from: KanbanStatus, to: KanbanStatus) => Promise<boolean>
}

const COLUMNS: { id: KanbanStatus; label: string }[] = [
  { id: 'pending_quote', label: 'Chiffrage' },
  { id: 'quoted', label: 'Devis envoye' },
  { id: 'awaiting_payment', label: 'Attente paiement' },
  { id: 'paid', label: 'Paye' },
  { id: 'ordered', label: 'Commande fournisseur' },
  { id: 'arrived_at_hub', label: 'Arrive au hub' },
  { id: 'converted_to_shipment', label: 'Converti' },
  { id: 'expired', label: 'Expire' },
  { id: 'failed', label: 'Echec' },
  { id: 'cancelled', label: 'Annule' },
]

function PurchaseCard({
  card,
  isStaff,
  isDragging,
  onDragStart,
}: {
  card: KanbanPurchaseCard
  isStaff: boolean
  isDragging: boolean
  onDragStart: (card: KanbanPurchaseCard) => void
}) {
  return (
    <div
      draggable={isStaff}
      onDragStart={() => onDragStart(card)}
      className={cn(
        'rounded-lg border bg-background p-3 shadow-sm cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <p className="text-sm font-medium line-clamp-2">{card.article_label || 'Demande sans libelle'}</p>
      {card.user?.name ? <p className="mt-1 text-xs text-muted-foreground">{card.user.name}</p> : null}
      {card.created_at ? (
        <p className="mt-2 text-[11px] text-muted-foreground">{new Date(card.created_at).toLocaleDateString('fr-FR')}</p>
      ) : null}
    </div>
  )
}

export default function KanbanBoard({ cards, isStaff, onMove }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<KanbanPurchaseCard | null>(null)
  const [hoverColumn, setHoverColumn] = useState<KanbanStatus | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<KanbanStatus, KanbanPurchaseCard[]>()
    COLUMNS.forEach((c) => map.set(c.id, []))
    cards.forEach((c) => {
      map.get(c.status)?.push(c)
    })
    return map
  }, [cards])

  const handleDrop = async (to: KanbanStatus) => {
    if (!isStaff || !activeCard) return
    const from = activeCard.status
    const cardId = activeCard.id
    setHoverColumn(null)
    setActiveCard(null)
    if (!to || from === to) return

    const confirmMove = window.confirm(
      `Confirmer le changement de statut vers "${COLUMNS.find((c) => c.id === to)?.label}" ?`,
    )
    if (!confirmMove) return

    await onMove(cardId, from, to)
  }

  return (
    <div
      onDragEnd={() => {
        setActiveCard(null)
        setHoverColumn(null)
      }}
    >
      <div className="grid gap-3 lg:grid-cols-5">
        {COLUMNS.map((column) => {
          const items = grouped.get(column.id) ?? []
          return (
            <div
              key={column.id}
              id={column.id}
              className={cn(
                'rounded-xl border bg-muted/30 p-2 min-h-[260px] transition-colors',
                hoverColumn === column.id && 'bg-primary/10 border-primary/40',
              )}
              onDragOver={(e) => {
                if (!isStaff) return
                e.preventDefault()
                setHoverColumn(column.id)
              }}
              onDragLeave={() => {
                if (hoverColumn === column.id) {
                  setHoverColumn(null)
                }
              }}
              onDrop={(e) => {
                if (!isStaff) return
                e.preventDefault()
                handleDrop(column.id)
              }}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-muted-foreground">{column.label}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {items.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {items.map((card) => (
                  <PurchaseCard
                    key={card.id}
                    card={card}
                    isStaff={isStaff}
                    isDragging={activeCard?.id === card.id}
                    onDragStart={(draggedCard) => setActiveCard(draggedCard)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

