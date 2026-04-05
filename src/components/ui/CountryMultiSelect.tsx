import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { CountryFlag } from '@/components/CountryFlag'

export type CountryMultiSelectOption = {
  id: number
  name: string
  code?: string | null
  iso2?: string | null
  emoji?: string | null
}

export type CountryMultiSelectProps = {
  id?: string
  options: CountryMultiSelectOption[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

export function CountryMultiSelect({
  id,
  options,
  selectedIds,
  onChange,
  placeholder = 'Choisir des pays…',
  searchPlaceholder = 'Rechercher un pays…',
  emptyText = 'Aucun pays trouvé.',
  disabled,
  className,
}: CountryMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const set = React.useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedCountries = React.useMemo(
    () => options.filter((c) => set.has(c.id)),
    [options, set],
  )

  const toggle = (cid: number) => {
    if (set.has(cid)) {
      onChange(selectedIds.filter((x) => x !== cid))
    } else {
      onChange([...selectedIds, cid])
    }
  }

  const remove = (cid: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedIds.filter((x) => x !== cid))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-auto min-h-10 w-full justify-between px-3 py-2 font-normal"
          >
            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
              {selectedCountries.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedCountries.map((c) => (
                  <Badge key={c.id} variant="secondary" className="gap-1 pr-1 font-normal">
                    <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="!h-3 !w-4" />
                    <span className="max-w-[140px] truncate">{c.name}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="rounded-sm p-0.5 hover:bg-muted"
                      onClick={(e) => remove(c.id, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          remove(c.id, e as unknown as React.MouseEvent)
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[min(100vw-2rem,420px)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((c) => {
                  const sel = set.has(c.id)
                  const code = c.iso2 || c.code || ''
                  return (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${code} ${c.id}`}
                      keywords={[c.name, code, String(c.id)]}
                      onSelect={() => toggle(c.id)}
                    >
                      <Check className={cn('mr-2 h-4 w-4', sel ? 'opacity-100' : 'opacity-0')} />
                      <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="mr-2 !h-4 !w-5" />
                      <span className="flex-1 truncate">{c.name}</span>
                      {code ? <span className="text-muted-foreground text-xs">({code})</span> : null}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
