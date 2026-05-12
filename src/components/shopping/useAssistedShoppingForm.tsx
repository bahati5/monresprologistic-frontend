import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { useSearchClients } from '@/hooks/useShipments'
import type { DbComboboxOption } from '@/components/ui/DbCombobox'
import {
  type AssistedShoppingFormValues,
  type AssistedShoppingMerchantOption,
  type ExtractedProduct,
  type ExtractionState,
  type WizardClientSearchRow,
  buildAssistedShoppingSchema,
  defaultArticle,
} from '@/components/shopping/assistedShoppingSchema'

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

function findMerchantByName(
  merchants: AssistedShoppingMerchantOption[],
  merchantName: string,
): AssistedShoppingMerchantOption | null {
  const target = merchantName.trim().toLowerCase()
  if (target === '') return null
  return (
    merchants.find((m) => {
      const n = String(m.name ?? '').trim().toLowerCase()
      return n === target || n.includes(target) || target.includes(n)
    }) ?? null
  )
}

export function useAssistedShoppingForm(
  isStaff: boolean,
  initialValues: AssistedShoppingFormValues | undefined,
  onValuesChange?: (values: AssistedShoppingFormValues) => void,
) {
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
    defaultValues: initialValues ?? {
      user_id: undefined,
      items: [defaultArticle()],
      notes: '',
    },
    shouldUnregister: false,
  })

  const formValues = watch()
  /** Évite une boucle infinie : `watch()` peut renvoyer un nouvel objet à chaque rendu alors que les valeurs sont identiques. */
  const lastNotifiedSerialized = useRef<string | null>(null)
  useEffect(() => {
    if (!onValuesChange) return
    let serialized: string
    try {
      serialized = JSON.stringify(formValues)
    } catch {
      onValuesChange(formValues)
      return
    }
    if (serialized === lastNotifiedSerialized.current) return
    lastNotifiedSerialized.current = serialized
    onValuesChange(formValues)
  }, [formValues, onValuesChange])

  const [selectedClientLabel, setSelectedClientLabel] = useState<string>('')
  const currentUserId = watch('user_id')

  useEffect(() => {
    if (!currentUserId || selectedClientLabel) return
    api
      .get<{ name?: string; full_name?: string }>(`/api/shipment-wizard/client-name/${currentUserId}`)
      .then((res) => {
        const name = res.data?.full_name || res.data?.name
        if (name) setSelectedClientLabel(name)
      })
      .catch(() => {})
  }, [currentUserId, selectedClientLabel])

  const [clientSearch, setClientSearch] = useState('')
  const { data: clientsRaw, isFetching: clientsLoading } = useSearchClients(clientSearch)

  const clientComboboxOptions: DbComboboxOption[] = useMemo(() => {
    const rows = Array.isArray(clientsRaw) ? (clientsRaw as WizardClientSearchRow[]) : []
    return rows.map((r) => {
      const hasPortal = r.has_portal === true || (r.user_id != null && Number(r.user_id) > 0)
      const uid = hasPortal ? Number(r.user_id) : 0
      const sub = [r.email, r.phone].filter(Boolean).join(' · ')
      const portalTag = hasPortal ? 'Portail' : 'Sans portail'
      const value = hasPortal ? String(uid) : `profile:${r.id}`
      return {
        value,
        label: (
          <div className="flex flex-col items-start gap-0.5 py-0.5 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium leading-tight">{r.name ?? 'Client'}</span>
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${hasPortal ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {portalTag}
              </span>
            </div>
            <span className="text-xs font-normal text-muted-foreground">
              {sub || 'Aucun contact'}
              {r.locker_code ? ` · Casier ${r.locker_code}` : ''}
            </span>
          </div>
        ),
        keywords: [r.name ?? '', r.email ?? '', r.phone ?? '', r.locker_code ?? ''].filter(Boolean) as string[],
      }
    })
  }, [clientsRaw])

  const clientsRawRef = useRef(clientsRaw)
  clientsRawRef.current = clientsRaw

  const resolveClientSelection = useCallback(
    async (comboValue: string, createPortal: boolean): Promise<number | undefined> => {
      if (!comboValue) return undefined
      if (!comboValue.startsWith('profile:')) {
        const n = Number(comboValue)
        return Number.isFinite(n) && n > 0 ? n : undefined
      }
      const profileId = Number(comboValue.replace('profile:', ''))
      const rows = Array.isArray(clientsRawRef.current) ? (clientsRawRef.current as WizardClientSearchRow[]) : []
      const row = rows.find((r) => r.id === profileId)
      if (!row) return undefined

      if (!createPortal) {
        return profileId
      }

      try {
        const res = await api.post<{ id: number; user_id?: number; has_portal?: boolean }>(
          '/api/shipment-wizard/quick-create-portal',
          { profile_id: profileId },
        )
        const userId = res.data?.user_id
        if (userId && Number.isFinite(userId) && userId > 0) {
          return userId
        }
      } catch {
        // Portal creation failed, return profile id
      }
      return profileId
    },
    [],
  )

  const trackClientSelection = useCallback(
    (comboValue: string) => {
      if (!comboValue) {
        setSelectedClientLabel('')
        return
      }
      const rows = Array.isArray(clientsRawRef.current) ? (clientsRawRef.current as WizardClientSearchRow[]) : []
      const hasPortalPrefix = comboValue.startsWith('profile:')
      const profileId = hasPortalPrefix ? Number(comboValue.replace('profile:', '')) : null
      const userId = !hasPortalPrefix ? Number(comboValue) : null
      const row = rows.find((r) => {
        if (profileId != null) return r.id === profileId
        if (userId != null) return Number(r.user_id) === userId
        return false
      })
      if (row) {
        setSelectedClientLabel(row.name ?? 'Client')
      }
    },
    [],
  )

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const [detectHintByField, setDetectHintByField] = useState<Record<string, string>>({})
  const [extractStateByField, setExtractStateByField] = useState<Record<string, ExtractionState>>({})

  const { data: merchantsPayload, isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants', 'active'],
    queryFn: () => api.get<{ merchants: AssistedShoppingMerchantOption[] }>('/api/merchants').then((r) => r.data),
  })

  const merchants = useMemo(() => merchantsPayload?.merchants ?? [], [merchantsPayload])

  const clearDetectHint = useCallback((fieldId: string) => {
    setDetectHintByField((prev) => {
      if (!(fieldId in prev)) return prev
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }, [])

  const setExtractState = useCallback((fieldId: string, state: ExtractionState) => {
    setExtractStateByField((prev) => ({ ...prev, [fieldId]: state }))
  }, [])

  const applyUrlMerchantDetection = useCallback(
    (fieldId: string, index: number, urlValue: string) => {
      const trimmed = urlValue.trim()
      if (trimmed === '') {
        clearDetectHint(fieldId)
        setExtractState(fieldId, 'idle')
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
    [merchants, setValue, clearDetectHint, setExtractState],
  )

  const extractProductFromUrl = useCallback(
    async (fieldId: string, index: number, urlValue: string) => {
      const url = urlValue.trim()
      if (url === '') {
        setExtractState(fieldId, 'error')
        setDetectHintByField((prev) => ({ ...prev, [fieldId]: "Renseignez d'abord une URL valide." }))
        return
      }
      setExtractState(fieldId, 'running')
      setDetectHintByField((prev) => ({ ...prev, [fieldId]: 'Extraction en cours…' }))
      try {
        const launch = await api.post<{ cache_key: string }>('/api/assisted-purchases/extract-product', { url })
        const cacheKey = launch.data?.cache_key
        if (!cacheKey) {
          throw new Error('Cache key manquante')
        }

        let product: ExtractedProduct | null = null
        for (let attempt = 0; attempt < 20; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1500))
          const poll = await api.get<{ status: 'pending' | 'done'; product?: ExtractedProduct }>(
            `/api/assisted-purchases/extract-product/${cacheKey}`,
          )
          if (poll.data?.status === 'done') {
            product = poll.data.product ?? null
            break
          }
        }

        if (!product || product.success !== true) {
          setExtractState(fieldId, 'error')
          setDetectHintByField((prev) => ({
            ...prev,
            [fieldId]: "Extraction indisponible pour ce lien. Saisie manuelle possible.",
          }))
          return
        }

        const productName = typeof product.name === 'string' ? product.name.trim() : ''
        if (productName) {
          setValue(`items.${index}.name`, productName, { shouldDirty: true, shouldValidate: true })
        }

        const merchantName = typeof product.merchant === 'string' ? product.merchant.trim() : ''
        const matchedMerchant = merchantName ? findMerchantByName(merchants, merchantName) : null
        if (matchedMerchant) {
          setValue(`items.${index}.merchant_id`, matchedMerchant.id, { shouldDirty: true, shouldValidate: false })
        }

        const priceText =
          typeof product.price === 'number' && Number.isFinite(product.price)
            ? ` • ${product.price.toFixed(2)} ${String(product.currency ?? '').trim() || ''}`.trim()
            : ''
        setExtractState(fieldId, 'done')
        setDetectHintByField((prev) => ({
          ...prev,
          [fieldId]: `Extraction réussie : ${productName || 'article'}${priceText ? ` (${priceText})` : ''}`,
        }))
      } catch {
        setExtractState(fieldId, 'error')
        setDetectHintByField((prev) => ({
          ...prev,
          [fieldId]: "Extraction indisponible pour ce lien. Saisie manuelle possible.",
        }))
      }
    },
    [merchants, setExtractState, setValue],
  )

  return {
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
  }
}
