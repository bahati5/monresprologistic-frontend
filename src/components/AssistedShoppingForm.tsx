import { useCallback, useMemo, useState } from 'react'
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Link as LinkIcon, ShoppingBag, Trash2, Plus, UserSearch } from 'lucide-react'
import api from '@/api/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DbComboboxAsync, type DbComboboxOption } from '@/components/ui/DbCombobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSearchClients } from '@/hooks/useShipments'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type AssistedShoppingMerchantOption = {
  id: number
  name: string
  domains: string[] | null
  logo_url?: string | null
}

const articleLineSchema = z.object({
  url: z
    .string()
    .min(1, 'Le lien vers l’article est requis.')
    .url({ message: 'Saisissez une URL valide (ex. https://…).' }),
  /** Chaîne toujours définie après validation (évite undefined → clé absente du JSON). */
  name: z.preprocess(
    (v) => (typeof v === 'string' ? v : ''),
    z.string().max(255),
  ),
  options: z.string().optional().default(''),
  quantity: z.coerce.number().int('Nombre entier uniquement.').min(1, 'La quantité minimale est 1.'),
  merchant_id: z.number().int().positive().optional(),
})

function buildAssistedShoppingSchema(isStaff: boolean) {
  return z
    .object({
      /** Obligatoire côté UI/API si l’employé crée la demande au nom d’un client. */
      user_id: z.number().int().positive().optional(),
      items: z.array(articleLineSchema).min(1, 'Ajoutez au moins un article.'),
      notes: z.string().optional().default(''),
    })
    .superRefine((data, ctx) => {
      if (isStaff && (data.user_id == null || !Number.isFinite(data.user_id))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Recherchez et sélectionnez le client pour le compte duquel cette demande est créée.',
          path: ['user_id'],
        })
      }
    })
}

export type AssistedShoppingFormValues = z.infer<ReturnType<typeof buildAssistedShoppingSchema>>

type WizardClientSearchRow = {
  id: number
  user_id?: number | null
  name?: string
  email?: string
  phone?: string | null
}

const defaultArticle = (): AssistedShoppingFormValues['items'][number] => ({
  url: '',
  name: '',
  options: '',
  quantity: 1,
  merchant_id: undefined,
})

export type AssistedShoppingFormProps = {
  /** Appelé après validation réussie */
  onSubmit?: (data: AssistedShoppingFormValues) => void | Promise<void>
  /** État de chargement externe (ex. mutation API) */
  isSubmitting?: boolean
  className?: string
  /**
   * Employé / admin : affiche la recherche client obligatoire (création au nom d’un client).
   * Client final : masqué ; le serveur associe automatiquement `Auth::id()`.
   */
  isStaff?: boolean
}

function normalizeHostname(raw: string): string {
  return raw.replace(/^www\./i, '').toLowerCase()
}

function findMerchantForHostname(
  merchants: AssistedShoppingMerchantOption[],
  hostnameNorm: string,
): AssistedShoppingMerchantOption | null {
  for (const m of merchants) {
    const list = Array.isArray(m.domains) ? m.domains : []
    const hit = list.some((d) => {
      const dom = String(d || '')
        .trim()
        .toLowerCase()
      return dom !== '' && hostnameNorm.includes(dom)
    })
    if (hit) return m
  }
  return null
}

export function AssistedShoppingForm({
  onSubmit,
  isSubmitting = false,
  className,
  isStaff = false,
}: AssistedShoppingFormProps) {
  const schema = useMemo(() => buildAssistedShoppingSchema(isStaff), [isStaff])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssistedShoppingFormValues>({
    resolver: zodResolver(schema) as Resolver<AssistedShoppingFormValues>,
    defaultValues: {
      user_id: undefined,
      items: [defaultArticle()],
      notes: '',
    },
    /** Garantit que chaque ligne du tableau envoie bien `name` / `options` au submit. */
    shouldUnregister: false,
  })

  const [clientSearch, setClientSearch] = useState('')
  const { data: clientsRaw, isFetching: clientsLoading } = useSearchClients(clientSearch)

  const clientComboboxOptions: DbComboboxOption[] = useMemo(() => {
    const rows = Array.isArray(clientsRaw) ? (clientsRaw as WizardClientSearchRow[]) : []
    return rows
      .filter((r) => r.user_id != null && Number(r.user_id) > 0)
      .map((r) => {
        const uid = Number(r.user_id)
        const sub = [r.email, r.phone].filter(Boolean).join(' · ') || 'Compte portail'
        return {
          value: String(uid),
          label: (
            <div className="flex flex-col items-start gap-0.5 py-0.5 text-left">
              <span className="font-medium leading-tight">{r.name ?? 'Client'}</span>
              <span className="text-xs font-normal text-muted-foreground">{sub}</span>
            </div>
          ),
          keywords: [r.name ?? '', r.email ?? '', r.phone ?? ''].filter(Boolean) as string[],
        }
      })
  }, [clientsRaw])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const [detectHintByField, setDetectHintByField] = useState<Record<string, string>>({})

  const { data: merchantsPayload, isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants', 'active'],
    queryFn: () => api.get<{ merchants: AssistedShoppingMerchantOption[] }>('/api/merchants').then((r) => r.data),
  })

  const merchants = merchantsPayload?.merchants ?? []

  const clearDetectHint = useCallback((fieldId: string) => {
    setDetectHintByField((prev) => {
      if (!(fieldId in prev)) return prev
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }, [])

  const applyUrlMerchantDetection = useCallback(
    (fieldId: string, index: number, urlValue: string) => {
      const trimmed = urlValue.trim()
      if (trimmed === '') {
        clearDetectHint(fieldId)
        return
      }

      let hostnameNorm: string | null = null
      try {
        const u = new URL(trimmed)
        hostnameNorm = normalizeHostname(u.hostname)
      } catch {
        return
      }

      if (!hostnameNorm) {
        clearDetectHint(fieldId)
        return
      }

      const matched = findMerchantForHostname(merchants, hostnameNorm)
      if (matched) {
        setValue(`items.${index}.merchant_id`, matched.id, { shouldDirty: true, shouldValidate: false })
        setDetectHintByField((prev) => ({ ...prev, [fieldId]: `Détecté : ${matched.name}` }))
      } else {
        clearDetectHint(fieldId)
      }
    },
    [merchants, setValue, clearDetectHint],
  )

  const submit = handleSubmit(async (data: AssistedShoppingFormValues) => {
    await onSubmit?.(data)
  })

  return (
    <div className={cn('mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-2', className)}>
      {/* En-tête */}
      <header className="space-y-3 text-center sm:text-left">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/15 sm:mx-0">
          <ShoppingBag className="h-7 w-7" strokeWidth={1.75} aria-hidden />
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
        ) : null}

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
                    {detectHintByField[field.id] ? (
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400/90" role="status">
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

        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-12 w-full text-base font-semibold shadow-md transition-shadow hover:shadow-lg"
          >
            {isSubmitting ? 'Envoi en cours…' : 'Demander un devis (Gratuit)'}
          </Button>
        </div>
      </form>
    </div>
  )
}
