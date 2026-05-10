const STORAGE_KEY = 'monrespro_offline_shipment_drafts'

export interface OfflineShipmentDraft {
  id: string
  payload: Record<string, unknown>
  createdAt: string
  syncedAt?: string
}

function readAll(): OfflineShipmentDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(rows: OfflineShipmentDraft[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

export function saveOfflineShipmentDraft(payload: Record<string, unknown>): OfflineShipmentDraft {
  const rows = readAll()
  const row: OfflineShipmentDraft = {
    id: crypto.randomUUID(),
    payload,
    createdAt: new Date().toISOString(),
  }
  rows.unshift(row)
  writeAll(rows)
  return row
}

export function listOfflineShipmentDrafts(): OfflineShipmentDraft[] {
  return readAll()
}

export function removeOfflineShipmentDraft(id: string): void {
  const rows = readAll().filter((r) => r.id !== id)
  writeAll(rows)
}

