export function clientCityDisplayString(c: { city?: unknown }) {
  const city = c.city
  if (city && typeof city === 'object' && city !== null && 'name' in city) {
    return String((city as { name: string }).name)
  }
  return city ? String(city) : ''
}
