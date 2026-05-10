export function ShipmentDetailLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header bar */}
      <div className="glass neo-raised rounded-xl px-4 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/50 neo-inset" />
          <div className="h-5 w-44 rounded bg-white/50" />
          <div className="h-5 w-20 rounded-lg bg-white/40" />
          <div className="h-5 w-16 rounded-lg bg-white/40" />
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-7 w-20 rounded-md bg-white/40" />
          ))}
        </div>
      </div>

      {/* Stepper */}
      <div className="glass neo-raised-sm rounded-xl px-4 py-3">
        <div className="h-2 w-full rounded-full neo-inset bg-white/40 mb-3" />
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-white/40" />
              <div className="h-2.5 w-12 rounded bg-white/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Body 2 columns */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="glass neo-raised-sm rounded-xl h-64" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass neo-raised-sm rounded-xl p-4 space-y-2">
              <div className="h-4 w-24 rounded bg-white/40" />
              {[1, 2, 3].map(j => (
                <div key={j} className="h-3 w-full rounded bg-white/30" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
