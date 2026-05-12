import { Link as LinkIcon, Trash2, Plus, Loader2, Sparkles, Package, Info } from 'lucide-react'
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldArrayWithId, FieldErrors } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
  isStaff?: boolean
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
  isStaff = false,
}: AssistedShoppingLineItemsProps) {
  return (
    <>
      <div className="flex flex-col gap-4">
        {fields.map((field, index) => {
          const urlReg = register(`items.${index}.url`)
          const merchantId = watch(`items.${index}.merchant_id`)
          const selectValue = merchantId != null && Number.isFinite(merchantId) ? String(merchantId) : 'none'
          const extractionState = extractStateByField[field.id]

          return (
            <Card key={field.id} className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                {/* En-tête article */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#073763] text-[12px] font-bold text-white shadow-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Article</h3>
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[11px] gap-1.5 text-destructive hover:bg-destructive/5 px-3 rounded-full"
                      onClick={() => {
                        remove(index)
                        clearDetectHint(field.id)
                      }}
                    >
                      <Trash2 size={14} />
                      Retirer
                    </Button>
                  )}
                </div>

                {/* URL + extraction */}
                <div className="space-y-2.5 mb-5">
                  <Label htmlFor={`items.${index}.url`} className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <LinkIcon size={14} className="text-[#073763]" />
                    LIEN DE L'ARTICLE
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={`items.${index}.url`}
                        type="url"
                        inputMode="url"
                        autoComplete="url"
                        placeholder="Collez l'URL de l'article (Amazon, Zara, etc.)"
                        className={cn(
                          'h-10 text-sm border-primary/10 focus-visible:ring-[#073763] pr-10',
                          errors.items?.[index]?.url && 'border-destructive focus-visible:ring-destructive'
                        )}
                        aria-invalid={!!errors.items?.[index]?.url}
                        name={urlReg.name}
                        ref={urlReg.ref}
                        onBlur={(e) => {
                          urlReg.onBlur(e)
                          if (isStaff && e.target.value.trim()) {
                            void extractProductFromUrl(field.id, index, e.target.value.trim())
                          }
                        }}
                        onChange={(e) => {
                          urlReg.onChange(e)
                          applyUrlMerchantDetection(field.id, index, e.target.value)
                        }}
                        onPaste={(e) => {
                          if (isStaff) {
                            setTimeout(() => {
                              const val = (e.target as HTMLInputElement).value.trim()
                              if (val) {
                                applyUrlMerchantDetection(field.id, index, val)
                                void extractProductFromUrl(field.id, index, val)
                              }
                            }, 100)
                          }
                        }}
                      />
                      {extractionState === 'done' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                          <Sparkles size={16} />
                        </div>
                      )}
                      {extractionState === 'running' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#073763]">
                          <Loader2 size={16} className="animate-spin" />
                        </div>
                      )}
                    </div>
                    {!isStaff && (
                      <Button
                        type="button"
                        variant={extractionState === 'error' ? 'outline' : 'secondary'}
                        size="sm"
                        className={cn(
                          "h-10 px-4 text-xs font-semibold gap-2 shrink-0 transition-all",
                          extractionState === 'running' && "bg-[#073763] text-white"
                        )}
                        disabled={extractionState === 'running'}
                        onClick={() =>
                          void extractProductFromUrl(field.id, index, String(watch(`items.${index}.url`) ?? ''))
                        }
                      >
                        {extractionState === 'running' ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Analyse…
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Extraire
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {detectHintByField[field.id] && (
                    <div className={cn(
                      "flex items-start gap-2 p-2 rounded-lg text-[11px] font-medium",
                      extractionState === 'error' 
                        ? "bg-amber-50 text-amber-800 border border-amber-100" 
                        : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                    )}>
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <p>{detectHintByField[field.id]}</p>
                    </div>
                  )}
                  {errors.items?.[index]?.url && (
                    <p className="text-[11px] text-destructive font-medium pl-1" role="alert">
                      {errors.items[index]?.url?.message}
                    </p>
                  )}
                </div>

                {/* Grille: Marchand, Nom, Quantité, Options */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-muted/30 p-4 rounded-xl border border-primary/5">
                  <div className="space-y-1.5">
                    <Label htmlFor={`items.${index}.merchant_id`} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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
                      <SelectTrigger id={`items.${index}.merchant_id`} className="h-9 text-sm border-primary/10 bg-white">
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

                  <div className="space-y-1.5">
                    <Label htmlFor={`items.${index}.name`} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Nom de l'article
                    </Label>
                    <Input
                      id={`items.${index}.name`}
                      placeholder="Nom de l'article"
                      className="h-9 text-sm border-primary/10 bg-white"
                      {...register(`items.${index}.name`)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`items.${index}.quantity`} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Quantité
                    </Label>
                    <Input
                      id={`items.${index}.quantity`}
                      type="number"
                      min={1}
                      step={1}
                      className={cn('h-9 text-sm border-primary/10 bg-white', errors.items?.[index]?.quantity && 'border-destructive')}
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-[11px] text-destructive font-medium" role="alert">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`items.${index}.options`} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Options
                    </Label>
                    <Input
                      id={`items.${index}.options`}
                      placeholder="Taille, couleur…"
                      className="h-9 text-sm border-primary/10 bg-white"
                      {...register(`items.${index}.options`)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed border-2 py-8 text-muted-foreground hover:text-[#073763] hover:border-[#073763] hover:bg-[#073763]/5 transition-all gap-2 text-sm font-semibold rounded-xl"
        onClick={() => append(defaultArticle())}
      >
        <Plus size={18} />
        Ajouter un autre article à cette demande
      </Button>
    </>
  )
}
