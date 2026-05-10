import { useCallback, useEffect, useMemo, useState } from 'react'
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
  useEffect(() => {
    onValuesChange?.(formValues)
  }, [formValues, onValuesChange])

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
        for (let attempt = 0; attempt < 14; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200))
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
    merchants,
    merchantsLoading,
    detectHintByField,
    extractStateByField,
    clearDetectHint,
    applyUrlMerchantDetection,
    extractProductFromUrl,
  }
}
