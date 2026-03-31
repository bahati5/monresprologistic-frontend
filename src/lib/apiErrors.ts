/**
 * Extrait un message lisible depuis une erreur Axios / réponse API Laravel.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: string }).message
    if (msg === 'Network Error' || msg === 'ERR_NETWORK') {
      return "Impossible de joindre le serveur. Verifiez que l'API tourne et que le proxy Vite est actif (npm run dev)."
    }
  }

  const ax = err as { response?: { data?: unknown; status?: number } }
  const data = ax.response?.data as Record<string, unknown> | undefined
  if (!data || typeof data !== 'object') {
    return fallback
  }

  const errors = data.errors as Record<string, string[] | string> | undefined
  if (errors && typeof errors === 'object') {
    for (const key of Object.keys(errors)) {
      const v = errors[key]
      if (Array.isArray(v) && v[0]) return String(v[0])
      if (typeof v === 'string' && v) return v
    }
  }

  const m = data.message
  if (typeof m === 'string' && m.trim()) {
    // Message générique Laravel : préférer le détail dans errors si présent (déjà traité ci-dessus)
    if (m.includes('given data was invalid') || m.includes('données fournies sont invalides')) {
      return fallback
    }
    return m
  }

  return fallback
}
