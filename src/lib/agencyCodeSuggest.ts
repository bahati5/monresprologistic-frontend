/**
 * Propose un code court (3 car.) à partir du nom : 3 premières lettres alphabétiques (ex. « Paris » → PAR).
 */
export function suggestAgencyCodeFromName(name: string): string {
  const letters = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
  if (!letters) return ''
  return (letters + 'XXX').slice(0, 3)
}
