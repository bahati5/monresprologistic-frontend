import { ShoppingBag } from 'lucide-react'
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
    <div className={cn('mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-2', className)}>
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex items-start justify-between">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/15 sm:mx-0">
            <ShoppingBag className="h-7 w-7" strokeWidth={1.75} aria-hidden />
          </div>
          {headerSlot}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Nouvelle demande de Shopping Assisté
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Collez les liens de vos articles, notre équipe s’occupe de l’achat et de l’expédition.
          </p>
        </div>
      </header>

      <form onSubmit={submit} className="space-y-6">
        {isStaff ? (
          <AssistedShoppingClientFields
            control={control}
            errors={errors}
            clientComboboxOptions={clientComboboxOptions}
            clientSearch={clientSearch}
            setClientSearch={setClientSearch}
            clientsLoading={clientsLoading}
          />
        ) : null}

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

        <div className="space-y-2">
          <Label htmlFor="notes">Notes supplémentaires pour notre équipe</Label>
          <Textarea
            id="notes"
            rows={4}
            placeholder="Instructions, délais souhaités, préférences de livraison…"
            className="min-h-[120px] resize-y"
            {...register('notes')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {actionsSlot}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-12 flex-1 text-base font-semibold shadow-md transition-shadow hover:shadow-lg"
          >
            {isSubmitting ? 'Envoi en cours…' : 'Demander un devis (Gratuit)'}
          </Button>
        </div>
      </form>
    </div>
  )
}
