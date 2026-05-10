export function ShipmentDetailLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 rounded bg-muted animate-shimmer" />
      <div className="h-20 rounded-xl bg-card border animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 rounded-xl bg-card border animate-pulse" />
        <div className="h-48 rounded-xl bg-card border animate-pulse" />
      </div>
    </div>
  )
}
