import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Pencil, Lock, Circle, Eye, EyeOff, ToggleLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SettingsCard } from '../SettingsCard'
import {
  useQuoteLineTemplates,
  useReorderQuoteLineTemplates,
} from '@/hooks/useQuoteLineTemplates'
import { useCurrencySymbol } from '@/hooks/settings/useBranding'
import type { QuoteLineTemplate } from '@/types/assistedPurchase'
import { QuoteLineFormSheet } from './QuoteLineFormSheet'

/** L'API peut renvoyer default_value en string (décimal JSON / MySQL). */
function asNumericDefault(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function typeLabel(t: QuoteLineTemplate, currencySymbol: string): string {
  if (t.type === 'percentage') {
    const base = t.calculation_base === 'subtotal_after_commission' ? 'sous-total après commission' : 'prix produit'
    return `${asNumericDefault(t.default_value)}% du ${base}`
  }
  if (t.type === 'fixed_amount') {
    if (t.default_value == null) {
      return 'Montant fixe'
    }
    return `${currencySymbol}${asNumericDefault(t.default_value).toFixed(2)} fixe`
  }
  return 'Saisie manuelle'
}

function behaviorBadge(t: QuoteLineTemplate) {
  if (t.is_mandatory || t.behavior === 'mandatory') {
    return (
      <Badge variant="secondary" className="text-[10px] gap-1">
        <Lock size={10} /> Obligatoire
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[10px] gap-1">
      <Circle size={10} /> Optionnelle
    </Badge>
  )
}

function SortableRow({
  template,
  onEdit,
  currencySymbol,
}: {
  template: QuoteLineTemplate
  onEdit: (t: QuoteLineTemplate) => void
  currencySymbol: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: template.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card hover:bg-muted/30 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        {...attributes}
        {...listeners}
        aria-label="Réordonner"
      >
        <GripVertical size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{template.name}</span>
          {behaviorBadge(template)}
          {template.is_visible_to_client ? (
            <Eye size={12} className="text-muted-foreground" />
          ) : (
            <EyeOff size={12} className="text-muted-foreground" />
          )}
          {!template.is_active && (
            <Badge variant="destructive" className="text-[10px]">
              <ToggleLeft size={10} className="mr-0.5" /> Désactivée
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{typeLabel(template, currencySymbol)}</p>
        {template.description && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{template.description}</p>
        )}
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onEdit(template)}>
        <Pencil size={14} />
      </Button>
    </div>
  )
}

export function QuoteLineTemplatesSection() {
  const { data: templates, isLoading } = useQuoteLineTemplates()
  const reorder = useReorderQuoteLineTemplates()
  const currencySymbol = useCurrencySymbol()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<QuoteLineTemplate | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const active = (templates ?? []).filter((t) => t.is_active).sort((a, b) => a.display_order - b.display_order)
  const inactive = (templates ?? []).filter((t) => !t.is_active)

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active: dragActive, over } = event
      if (!over || dragActive.id === over.id) return

      const oldIndex = active.findIndex((t) => t.id === dragActive.id)
      const newIndex = active.findIndex((t) => t.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(active, oldIndex, newIndex)
      reorder.mutate(reordered.map((t) => t.id))
    },
    [active, reorder],
  )

  const handleEdit = (t: QuoteLineTemplate) => {
    setEditingTemplate(t)
    setSheetOpen(true)
  }

  const MAX_ACTIVE_LINES = 20
  const canCreateNew = active.length < MAX_ACTIVE_LINES

  const handleCreate = () => {
    if (!canCreateNew) return
    setEditingTemplate(null)
    setSheetOpen(true)
  }

  return (
    <>
      <SettingsCard
        title="Lignes de devis"
        icon={Plus}
        badge={`${active.length}/${MAX_ACTIVE_LINES} active${active.length > 1 ? 's' : ''}`}
        isLoading={isLoading}
        actions={
          <Button size="sm" onClick={handleCreate} disabled={!canCreateNew} className="gap-1.5">
            <Plus size={14} />
            Nouvelle ligne
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground mb-4">
          L'ordre défini ici est l'ordre d'affichage et de calcul sur le devis. Glissez pour réordonner.
          {!canCreateNew && (
            <span className="block mt-1 text-amber-600 font-medium">
              Limite de {MAX_ACTIVE_LINES} lignes actives atteinte. Désactivez une ligne existante pour en créer une nouvelle.
            </span>
          )}
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={active.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {active.map((t) => (
                <SortableRow key={t.id} template={t} onEdit={handleEdit} currencySymbol={currencySymbol} />
              ))}
              {active.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Aucune ligne active. Créez votre première ligne de devis.
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>

        {inactive.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowInactive(!showInactive)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showInactive ? 'Masquer' : 'Afficher'} les désactivées ({inactive.length})
            </button>
            {showInactive && (
              <div className="space-y-2 mt-2 opacity-60">
                {inactive.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium line-through">{t.name}</span>
                      <p className="text-xs text-muted-foreground">{typeLabel(t, currencySymbol)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}>
                      <Pencil size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SettingsCard>

      <QuoteLineFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingTemplate={editingTemplate}
      />
    </>
  )
}
