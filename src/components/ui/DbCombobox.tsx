import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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

export type DbComboboxOption = {
  value: string
  label: React.ReactNode
  keywords?: string[]
}

export type DbComboboxProps = {
  value: string
  onValueChange: (v: string) => void
  options: DbComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  isLoading?: boolean
  className?: string
  id?: string
}

/**
 * Liste déroulante recherche (Popover + Command) pour options issues de la BDD ou listes chargées.
 */
export function DbCombobox({
  value,
  onValueChange,
  options,
  placeholder = 'Choisir…',
  searchPlaceholder = 'Rechercher…',
  emptyText = 'Aucun résultat.',
  disabled,
  isLoading,
  className,
  id,
}: DbComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)
  const display = selected?.label ?? (value ? <span className="text-muted-foreground">{value}</span> : null)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn('h-10 w-full justify-between px-3 font-normal', className)}
        >
          <span className="truncate text-left">{isLoading ? 'Chargement…' : display ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[min(100vw-2rem,420px)] p-0"
        align="start"
      >
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
  )
}

export type DbComboboxAsyncProps = Omit<DbComboboxProps, 'options'> & {
  options: DbComboboxOption[]
  /** Requête affichée dans la zone de recherche (contrôlée par le parent, ex. appels API). */
  filterQuery: string
  onFilterQueryChange: (q: string) => void
  /** Si > 0, message tant que la longueur est insuffisante. */
  searchMinLength?: number
  belowMinText?: string
}

/**
 * Variante sans filtrage local : le parent met à jour `options` (ex. recherche API sur `filterQuery`).
 */
export function DbComboboxAsync({
  value,
  onValueChange,
  options,
  filterQuery,
  onFilterQueryChange,
  placeholder = 'Choisir…',
  searchPlaceholder = 'Rechercher…',
  emptyText = 'Aucun résultat.',
  disabled,
  isLoading,
  className,
  id,
  searchMinLength = 0,
  belowMinText,
}: DbComboboxAsyncProps) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)
  const display = selected?.label ?? (value ? <span className="text-muted-foreground">{value}</span> : null)
  const belowMin = searchMinLength > 0 && filterQuery.trim().length < searchMinLength
  const hint = belowMinText ?? `Saisissez au moins ${searchMinLength} caractères.`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn('h-10 w-full justify-between px-3 font-normal', className)}
        >
          <span className="truncate text-left">{isLoading ? 'Chargement…' : display ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[min(100vw-2rem,420px)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={filterQuery}
            onValueChange={onFilterQueryChange}
          />
          <CommandList>
            {belowMin ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">{hint}</div>
            ) : options.length === 0 ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : (
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
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
