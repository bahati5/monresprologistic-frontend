import KanbanBoard, { type KanbanPurchaseCard, type KanbanStatus } from '@/components/shopping/KanbanBoard'
import { AssistedPurchasesListFilters, type AssistedPurchasesListFiltersProps } from './AssistedPurchasesListFilters'

export interface AssistedPurchasesKanbanSectionProps {
  filtersProps: AssistedPurchasesListFiltersProps
  isKanbanLoading: boolean
  isStaff: boolean
  purchaseRows: Record<string, unknown>[]
  onMoveCard: (cardId: number, to: KanbanStatus) => Promise<boolean>
}

export function AssistedPurchasesKanbanSection({
  filtersProps,
  isKanbanLoading,
  isStaff,
  purchaseRows,
  onMoveCard,
}: AssistedPurchasesKanbanSectionProps) {
  return (
    <div className="space-y-3">
      <AssistedPurchasesListFilters {...filtersProps} />
      {isKanbanLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <KanbanBoard
          isStaff={isStaff}
          cards={
            purchaseRows.map((row) => ({
              id: Number(row.id),
              status: String(row.status ?? 'pending_quote') as KanbanStatus,
              article_label: (row.article_label as string | null) ?? null,
              product_url: (row.product_url as string | null) ?? null,
              created_at: row.created_at as string | undefined,
              user: row.user as { id: number; name?: string | null } | null,
            })) as KanbanPurchaseCard[]
          }
          onMove={async (cardId, _from, to) => onMoveCard(cardId, to)}
        />
      )}
    </div>
  )
}
