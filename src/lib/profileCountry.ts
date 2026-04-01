/** Extrait l’id pays depuis une réponse ProfileResource (GET client) ou équivalent. */
export function profileCountryIdFromApi(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined
  const o = data as { country?: { id?: unknown } | null }
  const id = o.country?.id
  if (id == null || id === '') return undefined
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : undefined
}
