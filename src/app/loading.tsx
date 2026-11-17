export default function HomeLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando página principal"
      className="mx-auto w-full max-w-6xl space-y-10 px-5 py-7 sm:space-y-14 sm:px-8 sm:py-12"
    >
      {/* Skeleton del Hero */}
      <section className="rounded-[32px] bg-brand-sky-tint px-6 py-8 shadow-xl shadow-black/[0.04] sm:px-10 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl flex-1 space-y-3.5">
            <div className="h-4 w-52 animate-pulse rounded-full bg-brand-green/20" />
            <div className="h-10 w-4/5 animate-pulse rounded-xl bg-brand-surface" />
            <div className="h-4 w-full max-w-lg animate-pulse rounded-lg bg-brand-surface/75" />
          </div>

          <div className="flex shrink-0 gap-3">
            <div className="h-11 w-32 animate-pulse rounded-2xl bg-brand-green/30" />
            <div className="h-11 w-36 animate-pulse rounded-2xl bg-brand-amber/40" />
          </div>
        </div>
      </section>

      {/* Skeleton de Categorías Circulares */}
      <div className="no-scrollbar flex items-start gap-4 overflow-hidden py-1 sm:grid sm:grid-cols-4 lg:grid-cols-8">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
          <div
            key={idx}
            className="flex min-w-[74px] shrink-0 flex-col items-center gap-2"
          >
            <div className="h-15 w-15 animate-pulse rounded-full bg-brand-sky-tint sm:h-16 sm:w-16" />
            <div className="h-3 w-14 animate-pulse rounded-full bg-brand-border" />
          </div>
        ))}
      </div>

      {/* Skeleton de Gastronomía Sanroqueña */}
      <section className="rounded-[30px] bg-brand-sky-tint/80 p-5 sm:p-8">
        <div className="h-6 w-36 animate-pulse rounded-full bg-brand-amber-soft" />
        <div className="mt-3 h-7 w-64 animate-pulse rounded-xl bg-brand-border" />
        <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl bg-brand-surface shadow-sm"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-brand-border" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-4/5 animate-pulse rounded-lg bg-brand-border" />
                <div className="h-3 w-1/2 animate-pulse rounded-lg bg-brand-border/70" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skeleton de Catálogo Destacado */}
      <section className="space-y-5">
        <div className="h-7 w-56 animate-pulse rounded-xl bg-brand-border" />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl bg-brand-surface shadow-sm"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-brand-border" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-4/5 animate-pulse rounded-lg bg-brand-border" />
                <div className="h-3 w-1/2 animate-pulse rounded-lg bg-brand-border/70" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skeleton de Sumate a Nosotros */}
      <div className="h-52 w-full animate-pulse rounded-[36px] bg-brand-green/25" />
    </div>
  );
}
