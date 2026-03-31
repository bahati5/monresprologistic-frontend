import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type SearchableOption = {
  value: string
  label: React.ReactNode
  keywords?: string[]
}

type Props = {
  value: string
  onValueChange: (v: string) => void
  options: SearchableOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  isLoading?: boolean
  onAdd?: () => void
  addLabel?: string
  className?: string
  id?: string
}

export function SearchableSelectWithAdd({
  value,
  onValueChange,
  options,
  placeholder = 'Choisir…',
  searchPlaceholder = 'Rechercher…',
  emptyText = 'Aucun résultat.',
  disabled,
  isLoading,
  onAdd,
  addLabel = 'Ajouter',
  className,
  id,
}: Props) {
  const [open, setOpen] = React.useState(false)

  const selected = options.find((o) => o.value === value)
  const display = selected?.label ?? (value ? <span className="text-muted-foreground">{value}</span> : null)

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className="h-10 flex-1 justify-between px-3 font-normal"
          >
            <span className="truncate text-left">
              {isLoading ? 'Chargement…' : display ?? placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[min(100vw-2rem,420px)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    keywords={opt.keywords ?? []}
                    onSelect={() => {
                      onValueChange(opt.value)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {onAdd ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={onAdd}
          disabled={disabled}
          title={addLabel}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">{addLabel}</span>
        </Button>
      ) : null}
    </div>
  )
}
