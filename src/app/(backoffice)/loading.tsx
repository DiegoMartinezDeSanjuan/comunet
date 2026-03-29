export default function BackofficeLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-7 w-48 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-72 rounded-md bg-muted/60" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-muted" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-20 rounded-md bg-muted" />
                <div className="h-3 w-16 rounded-md bg-muted/60" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <div className="h-5 w-40 rounded-md bg-muted" />
        </div>
        <div className="divide-y divide-border/20">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-48 rounded-md bg-muted" />
                <div className="h-3 w-32 rounded-md bg-muted/60" />
              </div>
              <div className="h-6 w-20 rounded-full bg-muted" />
              <div className="h-4 w-24 rounded-md bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
