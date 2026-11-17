export default function AdminLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando panel de auditoría municipal"
      className="mx-auto max-w-6xl space-y-6 px-3.5 py-6 sm:px-6 sm:py-8"
    >
      {/* Cabecera Institucional */}
      <div className="rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-5 shadow-2xs sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-6 w-44 animate-pulse rounded-full bg-[#D8D1C2]" />
          <div className="h-4 w-52 animate-pulse rounded-lg bg-[#EAE4D7]" />
        </div>
        <div className="mt-3 h-7 w-80 max-w-full animate-pulse rounded-xl bg-[#E8E2D5]" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded-lg bg-[#F6F3EC]" />
      </div>

      {/* 4 Tarjetas KPI */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-4 sm:p-5"
          >
            <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#E8E2D5]" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded-xl bg-[#D8D1C2]" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-[#F6F3EC]" />
          </div>
        ))}
      </div>

      {/* Barra de Pestañas */}
      <div className="flex flex-wrap gap-2">
        <div className="h-10 w-36 animate-pulse rounded-2xl bg-[#D8D1C2]" />
        <div className="h-10 w-44 animate-pulse rounded-2xl bg-[#FDFCFA]" />
        <div className="h-10 w-44 animate-pulse rounded-2xl bg-[#FDFCFA]" />
      </div>

      {/* Cola de Moderación */}
      <div className="space-y-4 rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-5 sm:p-6">
        <div className="h-6 w-56 animate-pulse rounded-xl bg-[#E8E2D5]" />
        <div className="space-y-3">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E6E1D6] bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-[#EAE4D7]" />
                <div className="space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded-lg bg-[#E8E2D5]" />
                  <div className="h-3 w-36 animate-pulse rounded-lg bg-[#F6F3EC]" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 animate-pulse rounded-xl bg-[#D8D1C2]" />
                <div className="h-9 w-24 animate-pulse rounded-xl bg-[#F6F3EC]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
