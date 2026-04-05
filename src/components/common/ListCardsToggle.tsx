import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import type { ListOrCards } from '@/lib/listViewMode'

type Props = {
  mode: ListOrCards
  onModeChange: (m: ListOrCards) => void
  className?: string
}

export function ListCardsToggle({ mode, onModeChange, className }: Props) {
  return (
    <div
      className={`flex items-center justify-end gap-1 rounded-lg border bg-muted/30 p-1 w-fit self-end ${className ?? ''}`.trim()}
      role="group"
      aria-label="Basculer entre liste et cartes"
    >
      <Button
        type="button"
        variant={mode === 'list' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-8 gap-1.5 px-2.5"
        onClick={() => onModeChange('list')}
        aria-pressed={mode === 'list'}
      >
        <List size={16} />
        <span className="hidden sm:inline text-xs">Liste</span>
      </Button>
      <Button
        type="button"
        variant={mode === 'cards' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-8 gap-1.5 px-2.5"
        onClick={() => onModeChange('cards')}
        aria-pressed={mode === 'cards'}
      >
        <LayoutGrid size={16} />
        <span className="hidden sm:inline text-xs">Cartes</span>
      </Button>
    </div>
  )
}
