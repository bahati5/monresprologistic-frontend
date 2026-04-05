export type ListOrCards = 'list' | 'cards'

export function loadViewMode(key: string, defaultMode: ListOrCards = 'list'): ListOrCards {
  try {
    const v = localStorage.getItem(key)
    if (v === 'cards' || v === 'list') return v
  } catch {
    /* ignore */
  }
  return defaultMode
}

export function saveViewMode(key: string, mode: ListOrCards): void {
  try {
    localStorage.setItem(key, mode)
  } catch {
    /* ignore */
  }
}
