/** Champs réservés à l’UI (non envoyés tels quels au backend). */
const UI_ONLY = new Set([
  'site_name',
  'site_url',
  'site_email',
  'zip_code',
  'phone_fixed',
  'phone_mobile',
  'locker_address_template',
  'symbol_position',
  'auto_verification',
  'registration_enabled',
  'admin_notification_on_signup',
  'app_name',
  'app_url',
  'app_email',
  'currency_position',
  'auto_verify',
  'allow_registration',
  'admin_notification',
  'locker_address',
  'postal_code',
  'phone',
  'mobile',
])

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null || raw === '') return fallback
  if (typeof raw === 'object') return raw as T
  try {
    return JSON.parse(String(raw)) as T
  } catch {
    return fallback
  }
}

function truthy(v: unknown): boolean {
  return v === '1' || v === 1 || v === true || v === 'true'
}

export function mapAppSettingsFromApi(data: { settings?: Record<string, unknown> } | Record<string, unknown>) {
  const raw =
    'settings' in data && data.settings && typeof data.settings === 'object'
      ? (data.settings as Record<string, unknown>)
      : (data as Record<string, unknown>)

  return {
    ...raw,
    app_name: String(raw.site_name ?? ''),
    app_url: String(raw.site_url ?? ''),
    app_email: String(raw.site_email ?? ''),
    phone: String(raw.phone_fixed ?? ''),
    mobile: String(raw.phone_mobile ?? ''),
    postal_code: String(raw.zip_code ?? ''),
    locker_address: String(raw.locker_address_template ?? ''),
    currency_position: raw.symbol_position === 'suffix' ? 'after' : 'before',
    auto_verify: truthy(raw.auto_verification),
    allow_registration: truthy(raw.registration_enabled),
    admin_notification: truthy(raw.admin_notification_on_signup),
    country_id:
      raw.country_id != null && raw.country_id !== '' ? Number(raw.country_id) : ('' as const),
    extra_languages: parseJson<{ code: string; label: string }[]>(raw.extra_languages, []),
    custom_currencies: parseJson<{ code: string; symbol: string; name: string }[]>(raw.custom_currencies, []),
    locker_digits: Number(raw.locker_digits ?? 4),
    decimals: Number(raw.decimals ?? 2),
  }
}

export function mapAppSettingsToApi(form: Record<string, unknown>) {
  const out: Record<string, unknown> = {}

  for (const [k, v] of Object.entries(form)) {
    if (UI_ONLY.has(k)) continue
    if (k === 'extra_languages' || k === 'custom_currencies') continue
    if (k === 'country_id') continue
    out[k] = v
  }

  out.site_name = form.app_name ?? form.site_name ?? ''
  out.site_url = form.app_url ?? form.site_url ?? ''
  out.site_email = form.app_email ?? form.site_email ?? ''
  out.phone_fixed = form.phone ?? form.phone_fixed ?? ''
  out.phone_mobile = form.mobile ?? form.phone_mobile ?? ''
  out.zip_code = form.postal_code ?? form.zip_code ?? ''
  out.locker_address_template = form.locker_address ?? form.locker_address_template ?? ''
  out.symbol_position = form.currency_position === 'after' ? 'suffix' : 'prefix'
  out.auto_verification = form.auto_verify ? '1' : '0'
  out.registration_enabled = form.allow_registration ? '1' : '0'
  out.admin_notification_on_signup = form.admin_notification ? '1' : '0'
  out.country_id = form.country_id === '' || form.country_id == null ? null : Number(form.country_id)
  out.extra_languages = JSON.stringify(form.extra_languages ?? [])
  out.custom_currencies = JSON.stringify(form.custom_currencies ?? [])

  return out
}
