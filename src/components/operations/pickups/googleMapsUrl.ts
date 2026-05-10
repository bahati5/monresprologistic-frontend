export function googleMapsUrl(address: string, lat?: number, lng?: number) {
  if (lat && lng && lat !== 0 && lng !== 0) {
    return `https://maps.google.com/?q=${lat},${lng}`
  }
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`
}
