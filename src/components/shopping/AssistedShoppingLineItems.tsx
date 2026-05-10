import { Link as LinkIcon, Trash2, Plus, Loader2, Sparkles } from 'lucide-react'
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldArrayWithId, FieldErrors } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  AssistedShoppingFormValues,
  AssistedShoppingMerchantOption,
  ExtractionState,
} from '@/components/shopping/assistedShoppingSchema'
import { defaultArticle } from '@/components/shopping/assistedShoppingSchema'

type AssistedShoppingLineItemsProps = {
  fields: FieldArrayWithId<AssistedShoppingFormValues, 'items', 'id'>[]
  register: UseFormRegister<AssistedShoppingFormValues>
  watch: UseFormWatch<AssistedShoppingFormValues>
  setValue: UseFormSetValue<AssistedShoppingFormValues>
  errors: FieldErrors<AssistedShoppingFormValues>
  merchants: AssistedShoppingMerchantOption[]
  merchantsLoading: boolean
  detectHintByField: Record<string, string>
  extractStateByField: Record<string, ExtractionState>
  remove: (index: number) => void
  append: (item: AssistedShoppingFormValues['items'][number]) => void
  clearDetectHint: (fieldId: string) => void
  applyUrlMerchantDetection: (fieldId: string, index: number, urlValue: string) => void
  extractProductFromUrl: (fieldId: string, index: number, urlValue: string) => Promise<void>
}

export function AssistedShoppingLineItems({
  fields,
  register,
  watch,
  setValue,
  errors,
  merchants,
  merchantsLoading,
  detectHintByField,
  extractStateByField,
  remove,
  append,
  clearDetectHint,
  applyUrlMerchantDetection,
  extractProductFromUrl,
}: AssistedShoppingLineItemsProps) {
  return (
    <>
      <div className="flex flex-col gap-6">
        {fields.map((field, index) => {
          const urlReg = register(`items.${index}.url`)

          const merchantId = watch(`items.${index}.merchant_id`)
          const selectValue = merchantId != null && Number.isFinite(merchantId) ? String(merchantId) : 'none'

          return (
            <Card
              key={field.id}
              className={cn(
                'border-border/60 bg-white p-6 shadow-sm ring-1 ring-black/[0.03] dark:border-border dark:bg-card dark:ring-white/[0.06]'
              )}
            >
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">Article</h2>
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1.5 text-destructive/90 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      remove(index)
                      clearDetectHint(field.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Supprimer cet article
                  </Button>
                )}
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.url`} className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    Lien de l’article
                  </Label>
                  <Input
                    id={`items.${index}.url`}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://amazon.fr/..."
                    className={cn(errors.items?.[index]?.url && 'border-destructive focus-visible:ring-destructive')}
                    aria-invalid={!!errors.items?.[index]?.url}
                    name={urlReg.name}
                    ref={urlReg.ref}
                    onBlur={urlReg.onBlur}
                    onChange={(e) => {
                      urlReg.onChange(e)
                      applyUrlMerchantDetection(field.id, index, e.target.value)
                    }}
                  />
                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={extractStateByField[field.id] === 'running'}
                      onClick={() =>
                        void extractProductFromUrl(field.id, index, String(watch(`items.${index}.url`) ?? ''))
                      }
                    >
                      {extractStateByField[field.id] === 'running' ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden />
                          Extraction…
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-3.5 w-3.5" aria-hidden />
                          Extraire nom/prix
                        </>
                      )}
                    </Button>
                  </div>
                  {detectHintByField[field.id] ? (
                    <p
                      className={cn(
                        'text-xs font-medium',
                        extractStateByField[field.id] === 'error'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400/90',
                      )}
                      role="status"
                    >
                      {detectHintByField[field.id]}
                    </p>
                  ) : null}
                  {errors.items?.[index]?.url && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.items[index]?.url?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.merchant_id`}>Marchand</Label>
                  <Select
                    value={selectValue}
                    disabled={merchantsLoading}
                    onValueChange={(v) => {
                      if (v === 'none') {
                        setValue(`items.${index}.merchant_id`, undefined, { shouldDirty: true, shouldValidate: false })
                      } else {
                        setValue(`items.${index}.merchant_id`, Number(v), { shouldDirty: true, shouldValidate: false })
                      }
                      clearDetectHint(field.id)
                    }}
                  >
                    <SelectTrigger id={`items.${index}.merchant_id`}>
                      <SelectValue placeholder={merchantsLoading ? 'Chargement…' : 'Choisir un marchand'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Autre / non listé</SelectItem>
                      {merchants.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.name`}>Nom de l’article</Label>
                    <Input
                      id={`items.${index}.name`}
                      placeholder="Nom de l’article"
                      {...register(`items.${index}.name`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.quantity`}>Quantité</Label>
                    <Input
                      id={`items.${index}.quantity`}
                      type="number"
                      min={1}
                      step={1}
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      className={cn(errors.items?.[index]?.quantity && 'border-destructive')}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.options`}>Options (taille, couleur, etc.)</Label>
                  <Input
                    id={`items.${index}.options`}
                    placeholder="Taille, couleur, etc."
                    {...register(`items.${index}.options`)}
                  />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed py-6 text-muted-foreground hover:text-foreground"
        onClick={() => append(defaultArticle())}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Ajouter un autre article
      </Button>
    </>
  )
}
