import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { DbComboboxOption } from '@/components/ui/DbCombobox'
import { CountryFlag } from '@/components/CountryFlag'
import { useLocationCountries, useLocationStates, useLocationCities } from '@/hooks/useLocationCascade'
import { useCreateCountry, useCreateState, useCreateCity } from '@/hooks/useSettings'

export type LocationCascadeValue = {
  countryId: number | '' | null
  stateId: number | '' | null
  cityId: number | '' | null
}

export const LOC_CLEAR = '__loc_clear__'

export function useLocationCascadeEnriched(
  value: LocationCascadeValue,
  onChange: (next: LocationCascadeValue) => void,
  { disabled, allowEmpty }: { disabled?: boolean; allowEmpty?: boolean },
) {
  const countryNum = value.countryId === '' || value.countryId == null ? undefined : Number(value.countryId)
  const stateNum = value.stateId === '' || value.stateId == null ? undefined : Number(value.stateId)

  const { data: countries = [], isLoading: loadingCountries } = useLocationCountries()
  const { data: states = [], isLoading: loadingStates } = useLocationStates(countryNum)
  const { data: cities = [], isLoading: loadingCities } = useLocationCities(stateNum)

  const createCountry = useCreateCountry()
  const createState = useCreateState()
  const createCity = useCreateCity()

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [wizCountryId, setWizCountryId] = useState<number | null>(null)
  const [wizStateId, setWizStateId] = useState<number | null>(null)

  const [cName, setCName] = useState('')
  const [cCode, setCCode] = useState('')
  const [cIso2, setCIso2] = useState('')
  const [cEmoji, setCEmoji] = useState('')
  const [rName, setRName] = useState('')
  const [vName, setVName] = useState('')

  const [stateDlgOpen, setStateDlgOpen] = useState(false)
  const [stateDlgName, setStateDlgName] = useState('')

  const [cityDlgOpen, setCityDlgOpen] = useState(false)
  const [cityDlgName, setCityDlgName] = useState('')

  const resetWizardFields = useCallback(() => {
    setWizardStep(1)
    setWizCountryId(null)
    setWizStateId(null)
    setCName('')
    setCCode('')
    setCIso2('')
    setCEmoji('')
    setRName('')
    setVName('')
  }, [])

  useEffect(() => {
    if (!wizardOpen) resetWizardFields()
  }, [wizardOpen, resetWizardFields])

  const countryOptions: DbComboboxOption[] = useMemo(() => {
    const rows = countries.map((c) => ({
      value: String(c.id),
      label: (
        <span className="flex items-center gap-2">
          <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="!h-4 !w-5" />
          <span>{c.name}</span>
          {c.iso2 ? <span className="text-muted-foreground text-xs">({c.iso2})</span> : null}
        </span>
      ),
      keywords: [c.name, String(c.id), c.code ?? '', c.iso2 ?? ''].filter(Boolean) as string[],
    }))
    if (allowEmpty) {
      return [
        {
          value: LOC_CLEAR,
          label: <span className="text-muted-foreground">(Aucun)</span>,
          keywords: ['aucun', 'clear'],
        },
        ...rows,
      ]
    }
    return rows
  }, [countries, allowEmpty])

  const stateOptions: DbComboboxOption[] = useMemo(
    () =>
      states.map((s) => ({
        value: String(s.id),
        label: s.name,
        keywords: [s.name, String(s.id)],
      })),
    [states],
  )

  const cityOptions: DbComboboxOption[] = useMemo(
    () =>
      cities.map((c) => ({
        value: String(c.id),
        label: c.name,
        keywords: [c.name, String(c.id)],
      })),
    [cities],
  )

  const setCountry = (v: string) => {
    if (!v || v === LOC_CLEAR) {
      onChange({ countryId: '', stateId: '', cityId: '' })
      return
    }
    onChange({ countryId: Number(v), stateId: '', cityId: '' })
  }

  const setState = (v: string) => {
    if (!v) {
      onChange({ ...value, stateId: '', cityId: '' })
      return
    }
    onChange({ ...value, stateId: Number(v), cityId: '' })
  }

  const setCity = (v: string) => {
    onChange({ ...value, cityId: v ? Number(v) : '' })
  }

  const openAddCountryWizard = () => {
    if (disabled) return
    resetWizardFields()
    setWizardOpen(true)
  }

  const openAddState = () => {
    if (disabled) return
    if (!countryNum) {
      toast.error('Choisissez d’abord un pays')
      return
    }
    setStateDlgName('')
    setStateDlgOpen(true)
  }

  const openAddCity = () => {
    if (disabled) return
    if (!stateNum) {
      toast.error('Choisissez d’abord une région')
      return
    }
    setCityDlgName('')
    setCityDlgOpen(true)
  }

  const submitWizardStep1 = async () => {
    const name = cName.trim()
    const code = cCode.trim().toUpperCase()
    if (!name || !code) {
      toast.error('Nom et code pays requis')
      return
    }
    try {
      const res = await createCountry.mutateAsync({
        name,
        code,
        iso2: cIso2.trim() || undefined,
        emoji: cEmoji.trim() || undefined,
      })
      const id = res.country?.id
      if (id == null) throw new Error('Réponse API invalide')
      setWizCountryId(id)
      setWizardStep(2)
      setRName('')
    } catch {
      /* toast géré par le hook */
    }
  }

  const submitWizardStep2 = async () => {
    const name = rName.trim()
    if (!name || wizCountryId == null) {
      toast.error('Nom de région requis')
      return
    }
    try {
      const res = await createState.mutateAsync({ name, country_id: wizCountryId })
      const id = res.state?.id
      if (id == null) throw new Error('Réponse API invalide')
      setWizStateId(id)
      setWizardStep(3)
      setVName('')
    } catch {
      /* hook */
    }
  }

  const submitWizardStep3 = async () => {
    const name = vName.trim()
    if (!name || wizStateId == null || wizCountryId == null) {
      toast.error('Nom de ville requis')
      return
    }
    try {
      const res = await createCity.mutateAsync({ name, state_id: wizStateId })
      const cid = res.city?.id
      if (cid == null) throw new Error('Réponse API invalide')
      onChange({
        countryId: wizCountryId,
        stateId: wizStateId,
        cityId: cid,
      })
      setWizardOpen(false)
    } catch {
      /* hook */
    }
  }

  const submitAddStateDialog = async () => {
    const name = stateDlgName.trim()
    if (!name || !countryNum) return
    try {
      const res = await createState.mutateAsync({ name, country_id: countryNum })
      const id = res.state?.id
      if (id == null) return
      onChange({ ...value, stateId: id, cityId: '' })
      setStateDlgOpen(false)
    } catch {
      /* hook */
    }
  }

  const submitAddCityDialog = async () => {
    const name = cityDlgName.trim()
    if (!name || !stateNum) return
    try {
      const res = await createCity.mutateAsync({ name, state_id: stateNum })
      const id = res.city?.id
      if (id == null) return
      onChange({ ...value, cityId: id })
      setCityDlgOpen(false)
    } catch {
      /* hook */
    }
  }

  const busy = createCountry.isPending || createState.isPending || createCity.isPending

  return {
    value,
    countryNum,
    stateNum,
    countryOptions,
    stateOptions,
    cityOptions,
    loadingCountries,
    loadingStates,
    loadingCities,
    setCountry,
    setState,
    setCity,
    openAddCountryWizard,
    openAddState,
    openAddCity,
    wizardOpen,
    setWizardOpen,
    wizardStep,
    cName,
    setCName,
    cCode,
    setCCode,
    cIso2,
    setCIso2,
    cEmoji,
    setCEmoji,
    rName,
    setRName,
    vName,
    setVName,
    submitWizardStep1,
    submitWizardStep2,
    submitWizardStep3,
    busy,
    stateDlgOpen,
    setStateDlgOpen,
    stateDlgName,
    setStateDlgName,
    submitAddStateDialog,
    cityDlgOpen,
    setCityDlgOpen,
    cityDlgName,
    setCityDlgName,
    submitAddCityDialog,
    createState,
    createCity,
    allowEmpty,
  }
}
