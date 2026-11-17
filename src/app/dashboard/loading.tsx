export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando panel del emprendedor"
      className="mx-auto w-full max-w-2xl space-y-6 px-4 py-5 sm:px-6 sm:py-8"
    >
      {/* Skeleton Header y Estado */}
      <section className="rounded-[28px] bg-white p-5 shadow-xl shadow-black/5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-3.5 w-36 animate-pulse rounded-full bg-[#F7EFE0]" />
              <div className="h-8 w-48 animate-pulse rounded-xl bg-[#E8E2D5]" />
            </div>
            <div className="h-7 w-44 animate-pulse rounded-full bg-[#E6F0EA]" />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-[#F6F3EC] px-4 py-3.5">
            <div className="h-4 w-36 animate-pulse rounded-lg bg-[#E8E2D5]" />
            <div className="h-8 w-11 animate-pulse rounded-xl bg-white" />
          </div>
        </div>
      </section>

      {/* Skeleton Acción Principal full-width */}
      <div className="h-[58px] w-full animate-pulse rounded-2xl bg-[#D8D1C2]" />

      {/* Skeleton Sección Mis Publicaciones */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-[#E8E2D5]" />
          <div className="h-4 w-20 animate-pulse rounded-lg bg-[#E8E2D5]" />
        </div>

        <div className="flex flex-col gap-3.5">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white p-3.5 shadow-lg shadow-black/[0.04] sm:p-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-[#EAE4D7] sm:h-24 sm:w-24" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <div className="h-4 w-11/12 animate-pulse rounded-lg bg-[#E8E2D5]" />
                    <div className="h-4 w-2/3 animate-pulse rounded-lg bg-[#F6F3EC]" />
                  </div>
                  <div className="flex min-h-[44px] items-center justify-between rounded-xl bg-[#F6F3EC] px-3.5 py-2">
                    <div className="space-y-1">
                      <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#E8E2D5]" />
                      <div className="h-2.5 w-32 animate-pulse rounded-full bg-[#E8E2D5]/70" />
                    </div>
                    <div className="h-8 w-14 shrink-0 animate-pulse rounded-full bg-[#D8D1C2]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
