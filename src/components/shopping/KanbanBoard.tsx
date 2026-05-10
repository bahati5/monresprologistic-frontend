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
  { id: 'quoted', label: 'Devis envoyé' },
  { id: 'awaiting_payment', label: 'Attente paiement' },
  { id: 'paid', label: 'Payé' },
  { id: 'ordered', label: 'Commandé' },
  { id: 'arrived_at_hub', label: 'Au hub' },
  { id: 'converted_to_shipment', label: 'Converti' },
  { id: 'expired', label: 'Expiré' },
  { id: 'failed', label: 'Échec' },
  { id: 'cancelled', label: 'Annulé' },
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
        'glass neo-raised-sm rounded-lg p-2.5 cursor-grab active:cursor-grabbing transition-all',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <p className="text-xs font-medium line-clamp-2 text-foreground">
        {card.article_label || 'Demande sans libellé'}
      </p>
      {card.user?.name && (
        <p className="mt-1 text-[10px] text-muted-foreground truncate">{card.user.name}</p>
      )}
      {card.created_at && (
        <p className="mt-1.5 text-[10px] text-muted-foreground tabular-nums">
          {new Date(card.created_at).toLocaleDateString('fr-FR')}
        </p>
      )}
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
      `Confirmer le changement de statut vers « ${COLUMNS.find((c) => c.id === to)?.label} » ?`,
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
      <div className="grid gap-2.5 lg:grid-cols-5">
        {COLUMNS.map((column) => {
          const items = grouped.get(column.id) ?? []
          return (
            <div
              key={column.id}
              id={column.id}
              className={cn(
                'neo-inset rounded-xl p-2 min-h-[200px] transition-colors',
                hoverColumn === column.id && 'bg-[#073763]/5 ring-1 ring-[#073763]/20',
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
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {column.label}
                </span>
                <Badge variant="secondary" className="text-[9px] h-4 px-1">
                  {items.length}
                </Badge>
              </div>
              <div className="space-y-1.5">
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
