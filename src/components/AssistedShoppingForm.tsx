import { ArrowRight, FileText, Loader2, Package, Send, ShoppingBag, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  hideHeader = false,
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
    resolveClientSelection,
    trackClientSelection,
    selectedClientLabel,
    setSelectedClientLabel,
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
    <div className={cn('mx-auto max-w-4xl space-y-6 pb-16', className)}>
      {/* Header glass gradient */}
      {!hideHeader && (
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
      )}

      <form onSubmit={submit} className="space-y-6">
        {isStaff && (
          <Card className="overflow-hidden border-primary/10 shadow-md">
            <CardHeader className="bg-primary/[0.03] border-b border-primary/10 py-4">
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                <UserIcon size={18} className="text-[#073763]" />
                Client associé
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <AssistedShoppingClientFields
                control={control}
                errors={errors}
                clientComboboxOptions={clientComboboxOptions}
                clientSearch={clientSearch}
                setClientSearch={setClientSearch}
                clientsLoading={clientsLoading}
                resolveClientSelection={resolveClientSelection}
                trackClientSelection={trackClientSelection}
                selectedClientLabel={selectedClientLabel}
                onClientCreated={(userId, clientName) => {
                  setValue('user_id', userId, { shouldDirty: true, shouldValidate: true })
                  if (clientName) setSelectedClientLabel(clientName)
                }}
              />
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Package size={18} className="text-[#073763]" />
            <h2 className="text-lg font-semibold">Articles à acheter</h2>
          </div>
          
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
            isStaff={isStaff}
          />
        </div>

        <Card className="overflow-hidden border-primary/10 shadow-md">
          <CardHeader className="bg-primary/[0.03] border-b border-primary/10 py-4">
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <FileText size={18} className="text-[#073763]" />
              Notes supplémentaires
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <Textarea
              id="notes"
              rows={3}
              placeholder="Instructions, délais souhaités, préférences de livraison…"
              className="min-h-[100px] resize-y text-sm border-primary/10 focus-visible:ring-[#073763]"
              {...register('notes')}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-4 pt-4">
          {actionsSlot}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="flex-1 h-12 text-base font-semibold bg-[#073763] hover:bg-[#0b5394] text-white shadow-lg shadow-[#073763]/20 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {isStaff ? 'Enregistrement…' : 'Envoi en cours…'}
              </>
            ) : isStaff ? (
              <>
                <ArrowRight size={18} />
                Enregistrer et passer au devis
              </>
            ) : (
              <>
                <Send size={18} />
                Demander un devis
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
