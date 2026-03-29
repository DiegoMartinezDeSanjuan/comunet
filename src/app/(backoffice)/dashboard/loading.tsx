export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-7 w-44 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-80 rounded-md bg-muted/60" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-muted" />
      </div>

      {/* Financial KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-md bg-muted/60" />
                <div className="h-7 w-28 rounded-md bg-muted" />
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted/40" />
            </div>
            <div className="mt-3 h-3 w-20 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Incidents table skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div className="h-5 w-36 rounded-md bg-muted" />
            <div className="h-4 w-20 rounded-md bg-muted/60" />
          </div>
          <div className="divide-y divide-border/20">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-6 w-16 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-44 rounded-md bg-muted" />
                  <div className="h-3 w-28 rounded-md bg-muted/60" />
                </div>
                <div className="h-6 w-20 rounded-full bg-muted" />
                <div className="h-4 w-20 rounded-md bg-muted/60" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column: chart + mini stats */}
        <div className="space-y-6">
          {/* Chart skeleton */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
            <div className="h-5 w-36 rounded-md bg-muted mb-4" />
            <div className="mx-auto h-48 w-48 rounded-full bg-muted/30" />
          </div>

          {/* Mini stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 text-center"
              >
                <div className="mx-auto h-5 w-5 rounded bg-muted/40 mb-2" />
                <div className="mx-auto h-6 w-12 rounded-md bg-muted mb-1" />
                <div className="mx-auto h-3 w-20 rounded-md bg-muted/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
