export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando métricas">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="mb-2 h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-3 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="mb-3 h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-3 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
