export default function PortalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-44 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-64 rounded-md bg-muted/60" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 rounded-md bg-muted" />
                <div className="h-3 w-24 rounded-md bg-muted/60" />
              </div>
            </div>
            <div className="h-3 w-full rounded-md bg-muted/40" />
            <div className="h-3 w-3/4 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  )
}
