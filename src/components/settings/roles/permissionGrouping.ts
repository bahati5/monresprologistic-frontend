export interface RolesPermissionDatum {
  id: number
  name: string
}

export const ROLES_PERM_GROUPS: Record<string, string[]> = {
  'Expéditions': ['view_shipments', 'create_shipments', 'edit_shipments', 'delete_shipments'],
  'Casiers': ['view_lockers', 'manage_lockers'],
  'Finance': ['view_payments', 'approve_payments', 'manage_finances'],
  'Ramassage': ['manage_pickups', 'assign_drivers'],
  'Regroupements': ['view_regroupements', 'create_regroupements', 'manage_regroupements'],
  'Administration': ['manage_settings', 'manage_agencies', 'manage_users', 'manage_roles'],
  'Rapports': ['view_reports', 'export_data', 'view_analytics'],
  'Opérations': ['manage_statuses', 'manage_pricing', 'manage_notifications', 'manage_exchange_rates'],
  'Services': ['manage_pre_alerts', 'manage_assisted_purchases', 'manage_customer_packages', 'view_customer_packages'],
  'Personnes': ['manage_clients', 'manage_drivers'],
  'Outils': [
    'manage_newsletter',
    'manage_backups',
    'view_crm',
    'view_inbound',
    'view_tracking',
    'manage_documents',
  ],
  'Remboursements': ['manage_refunds', 'approve_refunds'],
}

export function groupRolePermissions(allPerms: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  const used = new Set<string>()

  for (const [group, perms] of Object.entries(ROLES_PERM_GROUPS)) {
    const matching = perms.filter((p) => allPerms.includes(p))
    if (matching.length > 0) {
      grouped[group] = matching
      matching.forEach((p) => used.add(p))
    }
  }

  const remaining = allPerms.filter((p) => !used.has(p))
  if (remaining.length > 0) {
    grouped['Autres'] = remaining
  }
  return grouped
}
