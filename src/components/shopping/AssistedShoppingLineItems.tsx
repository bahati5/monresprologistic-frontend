import { Link as LinkIcon, Trash2, Plus, Loader2, Sparkles, Package } from 'lucide-react'
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldArrayWithId, FieldErrors } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
      <div className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const urlReg = register(`items.${index}.url`)
          const merchantId = watch(`items.${index}.merchant_id`)
          const selectValue = merchantId != null && Number.isFinite(merchantId) ? String(merchantId) : 'none'

          return (
            <div
              key={field.id}
              className="glass neo-raised rounded-xl p-4"
            >
              {/* En-tête article */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#073763]/10 text-[10px] font-bold text-[#073763]">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">Article</h3>
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 text-destructive/80 hover:bg-destructive/10 hover:text-destructive px-2"
                    onClick={() => {
                      remove(index)
                      clearDetectHint(field.id)
                    }}
                  >
                    <Trash2 size={12} />
                    Supprimer
                  </Button>
                )}
              </div>

              {/* URL + extraction */}
              <div className="space-y-2 mb-3">
                <Label htmlFor={`items.${index}.url`} className="text-xs font-medium flex items-center gap-1.5">
                  <LinkIcon size={12} className="text-muted-foreground" />
                  Lien de l'article
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`items.${index}.url`}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://amazon.fr/..."
                    className={cn('flex-1 h-8 text-sm', errors.items?.[index]?.url && 'border-destructive focus-visible:ring-destructive')}
                    aria-invalid={!!errors.items?.[index]?.url}
                    name={urlReg.name}
                    ref={urlReg.ref}
                    onBlur={urlReg.onBlur}
                    onChange={(e) => {
                      urlReg.onChange(e)
                      applyUrlMerchantDetection(field.id, index, e.target.value)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] gap-1 shrink-0"
                    disabled={extractStateByField[field.id] === 'running'}
                    onClick={() =>
                      void extractProductFromUrl(field.id, index, String(watch(`items.${index}.url`) ?? ''))
                    }
                  >
                    {extractStateByField[field.id] === 'running' ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Extraction…
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        Extraire
                      </>
                    )}
                  </Button>
                </div>
                {detectHintByField[field.id] && (
                  <p
                    className={cn(
                      'text-[11px] font-medium',
                      extractStateByField[field.id] === 'error'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400/90',
                    )}
                    role="status"
                  >
                    {detectHintByField[field.id]}
                  </p>
                )}
                {errors.items?.[index]?.url && (
                  <p className="text-[11px] text-destructive" role="alert">
                    {errors.items[index]?.url?.message}
                  </p>
                )}
              </div>

              {/* Grille: Marchand, Nom, Quantité, Options */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor={`items.${index}.merchant_id`} className="text-xs font-medium">
                    Marchand
                  </Label>
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
                    <SelectTrigger id={`items.${index}.merchant_id`} className="h-8 text-sm">
                      <SelectValue placeholder={merchantsLoading ? 'Chargement…' : 'Marchand'} />
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

                <div className="space-y-1">
                  <Label htmlFor={`items.${index}.name`} className="text-xs font-medium">
                    Nom de l'article
                  </Label>
                  <Input
                    id={`items.${index}.name`}
                    placeholder="Nom"
                    className="h-8 text-sm"
                    {...register(`items.${index}.name`)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`items.${index}.quantity`} className="text-xs font-medium">
                    Quantité
                  </Label>
                  <Input
                    id={`items.${index}.quantity`}
                    type="number"
                    min={1}
                    step={1}
                    className={cn('h-8 text-sm', errors.items?.[index]?.quantity && 'border-destructive')}
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-[11px] text-destructive" role="alert">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`items.${index}.options`} className="text-xs font-medium">
                    Options
                  </Label>
                  <Input
                    id={`items.${index}.options`}
                    placeholder="Taille, couleur…"
                    className="h-8 text-sm"
                    {...register(`items.${index}.options`)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed py-4 text-muted-foreground hover:text-foreground gap-2 text-sm"
        onClick={() => append(defaultArticle())}
      >
        <Plus size={14} />
        Ajouter un article
      </Button>
    </>
  )
}
