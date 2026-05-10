export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon apres-midi'
  return 'Bonsoir'
}

export function isStaffDashboard(type: string): boolean {
  return type === 'admin' || type === 'employee' || type === 'operator'
}
