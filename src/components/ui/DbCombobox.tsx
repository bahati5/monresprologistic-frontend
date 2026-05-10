import * as React from 'react'
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react'
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

const normVal = (v: string) => String(v)

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
  /** Filtre contrôlé : le parent filtre `options` ; pas de filtrage cmdk. */
  filterQuery?: string
  onFilterQueryChange?: (q: string) => void
  /** Ouvre le modal de création (parent). `searchHint` = saisie courante si filtre contrôlé. */
  onOpenCreateModal?: (searchHint?: string) => void
  createButtonTitle?: string
  /** Masquer le bouton + tout en gardant le callback (rare). */
  showCreateButton?: boolean
  /** Désactive uniquement le « + » (ex. pays non choisi) tout en le laissant visible. */
  createButtonDisabled?: boolean
  wrapperClassName?: string
  /** Longueur min. pour le raccourci « Créer » dans la liste vide (filtre contrôlé). */
  minLengthForCreate?: number
}

function CreateShortcutButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button type="button" variant="secondary" size="sm" className="mt-2 w-full" onClick={onClick}>
      {label}
    </Button>
  )
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
  filterQuery,
  onFilterQueryChange,
  onOpenCreateModal,
  createButtonTitle = 'Ajouter',
  showCreateButton = true,
  createButtonDisabled = false,
  wrapperClassName,
  minLengthForCreate = 2,
}: DbComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => normVal(o.value) === normVal(value))
  const display =
    selected?.label ??
    (value !== '' && value != null ? (
      <span className="text-muted-foreground">{String(value)}</span>
    ) : null)
  const controlledFilter = filterQuery !== undefined && onFilterQueryChange !== undefined
  const hint = filterQuery?.trim() ?? ''
  const canShortcutCreate =
    !!onOpenCreateModal &&
    controlledFilter &&
    hint.length >= minLengthForCreate &&
    options.length === 0

  const handleOpenCreate = (searchHint?: string) => {
    onOpenCreateModal?.(searchHint)
    setOpen(false)
  }

  const trigger = (
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
  )

  const popover = (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o && controlledFilter) onFilterQueryChange?.('')
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[min(100vw-2rem,420px)] p-0"
        align="start"
      >
        <Command shouldFilter={controlledFilter ? false : undefined}>
          {controlledFilter ? (
            <CommandInput
              placeholder={searchPlaceholder}
              value={filterQuery}
              onValueChange={onFilterQueryChange}
            />
          ) : (
            <CommandInput placeholder={searchPlaceholder} />
          )}
          <CommandList>
            {controlledFilter && isLoading ? (
              <div
                className="flex flex-col items-center justify-center gap-2 px-3 py-8"
                role="status"
                aria-busy="true"
                aria-label="Recherche en cours">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                <span className="text-sm text-muted-foreground">Recherche…</span>
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="px-2 py-3 text-center text-sm">
                    <p className="text-muted-foreground">{emptyText}</p>
                    {canShortcutCreate && (
                      <CreateShortcutButton
                        label={`Créer « ${hint} »…`}
                        onClick={() => handleOpenCreate(hint)}
                      />
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.value}
                      keywords={opt.keywords ?? []}
                      onSelect={() => {
                        onValueChange(String(opt.value))
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          normVal(value) === normVal(opt.value) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  if (onOpenCreateModal && showCreateButton !== false) {
    return (
      <div className={cn('flex gap-2', wrapperClassName)}>
        <div className="min-w-0 flex-1">{popover}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled={disabled || createButtonDisabled}
          title={createButtonTitle}
          onClick={() => handleOpenCreate(controlledFilter ? hint || undefined : undefined)}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">{createButtonTitle}</span>
        </Button>
      </div>
    )
  }

  return popover
}

export type DbComboboxAsyncProps = Omit<DbComboboxProps, 'options' | 'filterQuery' | 'onFilterQueryChange'> & {
  options: DbComboboxOption[]
  filterQuery: string
  onFilterQueryChange: (q: string) => void
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
  onOpenCreateModal,
  createButtonTitle = 'Ajouter',
  showCreateButton,
  createButtonDisabled = false,
  wrapperClassName,
  minLengthForCreate,
}: DbComboboxAsyncProps) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => normVal(o.value) === normVal(value))
  const display =
    selected?.label ??
    (value !== '' && value != null ? (
      <span className="text-muted-foreground">{String(value)}</span>
    ) : null)
  const belowMin = searchMinLength > 0 && filterQuery.trim().length < searchMinLength
  const hint = belowMinText ?? `Saisissez au moins ${searchMinLength} caractères.`
  const effMin = minLengthForCreate ?? searchMinLength
  const canEmptyCreate =
    !!onOpenCreateModal &&
    !belowMin &&
    !isLoading &&
    options.length === 0 &&
    filterQuery.trim().length >= effMin

  const handleOpenCreate = (searchHint?: string) => {
    onOpenCreateModal?.(searchHint)
    setOpen(false)
  }

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      className={cn('h-10 w-full justify-between px-3 font-normal', className)}
    >
      <span className="truncate text-left">{display ?? placeholder}</span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )

  const popover = (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) onFilterQueryChange('')
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
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
            ) : isLoading ? (
              <div
                className="flex flex-col items-center justify-center gap-2 px-3 py-8"
                role="status"
                aria-busy="true"
                aria-label="Recherche en cours">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                <span className="text-sm text-muted-foreground">Recherche…</span>
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>
                <div className="px-2 py-3 text-center text-sm">
                  <p className="text-muted-foreground">{emptyText}</p>
                  {canEmptyCreate && (
                    <CreateShortcutButton
                      label={`Créer « ${filterQuery.trim()} »…`}
                      onClick={() => handleOpenCreate(filterQuery.trim())}
                    />
                  )}
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    keywords={opt.keywords ?? []}
                    onSelect={() => {
                      onValueChange(String(opt.value))
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        normVal(value) === normVal(opt.value) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
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

  if (onOpenCreateModal && showCreateButton !== false) {
    return (
      <div className={cn('flex gap-2', wrapperClassName)}>
        <div className="min-w-0 flex-1">{popover}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled={disabled || createButtonDisabled}
          title={createButtonTitle}
          onClick={() => handleOpenCreate(filterQuery.trim() || undefined)}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">{createButtonTitle}</span>
        </Button>
      </div>
    )
  }

  return popover
}
