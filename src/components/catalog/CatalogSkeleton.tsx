export function CatalogHeaderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-[32px] bg-brand-sky-light/60 px-6 py-7 shadow-2xl shadow-black/5 sm:px-10 sm:py-9"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="h-7 w-32 animate-pulse rounded-full bg-brand-surface" />
        <div className="h-7 w-44 animate-pulse rounded-full bg-brand-surface/80" />
      </div>
      <div className="mt-4 h-8 w-72 max-w-full animate-pulse rounded-xl bg-brand-surface/80" />
      <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded-lg bg-brand-surface/60" />
    </div>
  );
}

export function CatalogContentSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-hidden="true">
      {/* Buscador + pastillas circulares de categoría */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 flex-1 animate-pulse rounded-2xl bg-brand-surface shadow-xl shadow-black/5" />
          <div className="h-12 w-24 shrink-0 animate-pulse rounded-2xl bg-brand-green/30" />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <div className="h-11 w-36 animate-pulse rounded-full bg-brand-green/25" />
          <div className="h-11 w-32 animate-pulse rounded-full bg-brand-surface shadow-sm shadow-black/5" />
          <div className="h-11 w-40 animate-pulse rounded-full bg-brand-surface shadow-sm shadow-black/5" />
          <div className="h-11 w-36 animate-pulse rounded-full bg-brand-surface shadow-sm shadow-black/5" />
          <div className="h-11 w-32 animate-pulse rounded-full bg-brand-surface shadow-sm shadow-black/5" />
        </div>
      </div>

      {/* Esqueleto de Grilla (2 cols móvil, 3 tablet, 4 desktop) */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
          <div
            key={idx}
            className={`overflow-hidden rounded-[26px] border border-brand-sky/20 bg-brand-surface shadow-lg shadow-black/[0.04] ${
              idx >= 6 ? "hidden lg:block" : idx >= 4 ? "hidden md:block" : ""
            }`}
          >
            <div className="aspect-[4/5] w-full animate-pulse bg-brand-border" />
            <div className="space-y-2.5 p-3.5 sm:p-5">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-brand-border" />
              <div className="h-4 w-full animate-pulse rounded-full bg-brand-border/80" />
              <div className="h-9 w-full animate-pulse rounded-2xl bg-brand-green/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
