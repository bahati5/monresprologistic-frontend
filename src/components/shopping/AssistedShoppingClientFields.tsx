import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { UserSearch } from 'lucide-react'
import { DbComboboxAsync, type DbComboboxOption } from '@/components/ui/DbCombobox'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { AssistedShoppingFormValues } from '@/components/shopping/assistedShoppingSchema'

type AssistedShoppingClientFieldsProps = {
  control: Control<AssistedShoppingFormValues>
  errors: FieldErrors<AssistedShoppingFormValues>
  clientComboboxOptions: DbComboboxOption[]
  clientSearch: string
  setClientSearch: (v: string) => void
  clientsLoading: boolean
}

export function AssistedShoppingClientFields({
  control,
  errors,
  clientComboboxOptions,
  clientSearch,
  setClientSearch,
  clientsLoading,
}: AssistedShoppingClientFieldsProps) {
  return (
    <Card className="border-primary/25 bg-primary/[0.03] p-5 shadow-sm ring-1 ring-primary/10 dark:bg-primary/5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserSearch className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="assisted-shopping-client" className="text-base font-semibold">
              Client concerné
            </Label>
            <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">
              Obligatoire
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            La demande sera enregistrée sur le compte portail de ce client (devis, paiement, suivi).
          </p>
        </div>
      </div>
      <Controller
        name="user_id"
        control={control}
        render={({ field }) => (
          <DbComboboxAsync
            id="assisted-shopping-client"
            value={field.value != null && Number.isFinite(field.value) ? String(field.value) : ''}
            onValueChange={(v) => {
              const n = v ? Number(v) : NaN
              field.onChange(Number.isFinite(n) && n > 0 ? n : undefined)
            }}
            options={clientComboboxOptions}
            filterQuery={clientSearch}
            onFilterQueryChange={setClientSearch}
            searchMinLength={2}
            belowMinText="Saisissez au moins 2 caractères (nom, e-mail ou téléphone)."
            placeholder="Rechercher un client…"
            searchPlaceholder="Nom, e-mail ou téléphone…"
            emptyText="Aucun résultat. Vérifiez l’orthographe ou créez un compte portail depuis le CRM."
            isLoading={clientsLoading}
            showCreateButton={false}
            className={errors.user_id ? 'border-destructive' : undefined}
          />
        )}
      />
      {errors.user_id ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {errors.user_id.message}
        </p>
      ) : null}
    </Card>
  )
}
