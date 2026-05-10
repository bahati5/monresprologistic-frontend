import { ShoppingBag, Send, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AssistedShoppingClientFields } from '@/components/shopping/AssistedShoppingClientFields'
import { AssistedShoppingLineItems } from '@/components/shopping/AssistedShoppingLineItems'
import { useAssistedShoppingForm } from '@/components/shopping/useAssistedShoppingForm'
import {
  type AssistedShoppingFormProps,
  type AssistedShoppingFormValues,
  type AssistedShoppingMerchantOption,
} from '@/components/shopping/assistedShoppingSchema'

export type { AssistedShoppingFormValues, AssistedShoppingMerchantOption, AssistedShoppingFormProps }

export function AssistedShoppingForm({
  onSubmit,
  isSubmitting = false,
  className,
  isStaff = false,
  initialValues,
  onValuesChange,
  headerSlot,
  actionsSlot,
}: AssistedShoppingFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    errors,
    fields,
    append,
    remove,
    clientSearch,
    setClientSearch,
    clientComboboxOptions,
    clientsLoading,
    merchants,
    merchantsLoading,
    detectHintByField,
    extractStateByField,
    clearDetectHint,
    applyUrlMerchantDetection,
    extractProductFromUrl,
  } = useAssistedShoppingForm(isStaff, initialValues, onValuesChange)

  const submit = handleSubmit(async (data: AssistedShoppingFormValues) => {
    await onSubmit?.(data)
  })

  return (
    <div className={cn('mx-auto max-w-4xl space-y-5 pb-16', className)}>
      {/* Header glass gradient */}
      <div className="bg-linear-to-r from-[#073763] to-[#0b5394] rounded-xl p-6 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-light">Nouvelle demande</h1>
              <p className="text-white/70 text-sm font-light mt-0.5">
                Collez les liens de vos articles, notre équipe s'occupe de l'achat et de l'expédition.
              </p>
            </div>
          </div>
          {headerSlot}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {isStaff && (
          <div className="glass neo-raised rounded-xl p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle size={14} className="text-[#073763]" />
              Client associé
            </h2>
            <AssistedShoppingClientFields
              control={control}
              errors={errors}
              clientComboboxOptions={clientComboboxOptions}
              clientSearch={clientSearch}
              setClientSearch={setClientSearch}
              clientsLoading={clientsLoading}
            />
          </div>
        )}

        <AssistedShoppingLineItems
          fields={fields}
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          merchants={merchants}
          merchantsLoading={merchantsLoading}
          detectHintByField={detectHintByField}
          extractStateByField={extractStateByField}
          remove={remove}
          append={append}
          clearDetectHint={clearDetectHint}
          applyUrlMerchantDetection={applyUrlMerchantDetection}
          extractProductFromUrl={extractProductFromUrl}
        />

        <div className="glass neo-raised rounded-xl p-4 space-y-2">
          <Label htmlFor="notes" className="text-sm font-semibold">
            Notes supplémentaires
          </Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Instructions, délais souhaités, préférences de livraison…"
            className="min-h-[80px] resize-y text-sm"
            {...register('notes')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {actionsSlot}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="flex-1 h-11 text-sm font-semibold bg-[#073763] hover:bg-[#0b5394] text-white shadow-md gap-2"
          >
            <Send size={16} />
            {isSubmitting ? 'Envoi en cours…' : 'Demander un devis (gratuit)'}
          </Button>
        </div>
      </form>
    </div>
  )
}
