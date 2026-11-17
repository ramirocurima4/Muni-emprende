export default function HomeLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando página principal"
      className="mx-auto w-full max-w-6xl space-y-16 px-5 py-10 sm:space-y-24 sm:px-8 sm:py-16"
    >
      {/* Skeleton del Hero */}
      <section className="rounded-[36px] bg-white px-7 py-10 shadow-2xl shadow-black/5 sm:px-12 sm:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl flex-1 space-y-4">
            <div className="h-7 w-52 animate-pulse rounded-full bg-[#E6F0EA]" />
            <div className="space-y-2.5 pt-1">
              <div className="h-9 w-full animate-pulse rounded-xl bg-[#E8E2D5]" />
              <div className="h-9 w-4/5 animate-pulse rounded-xl bg-[#E8E2D5]" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-4 w-full max-w-xl animate-pulse rounded-lg bg-[#F6F3EC]" />
              <div className="h-4 w-3/4 max-w-md animate-pulse rounded-lg bg-[#F6F3EC]" />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3.5 pt-2">
            <div className="h-12 w-36 animate-pulse rounded-2xl bg-[#D8D1C2]" />
            <div className="h-12 w-40 animate-pulse rounded-2xl bg-[#F6F3EC]" />
          </div>
        </div>
      </section>

      {/* Skeleton del Carrusel de Productos Destacados */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3.5 w-40 animate-pulse rounded-full bg-[#F7EFE0]" />
            <div className="h-8 w-64 animate-pulse rounded-xl bg-[#E8E2D5]" />
          </div>
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="h-11 w-11 animate-pulse rounded-full bg-white shadow-xl shadow-black/5" />
            <div className="h-11 w-11 animate-pulse rounded-full bg-[#D8D1C2]" />
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-6 overflow-hidden px-4 pt-4 pb-12 sm:-mx-6 sm:gap-8 sm:px-6 sm:pt-5 sm:pb-14">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="flex h-[430px] w-[82%] min-w-[276px] max-w-[320px] shrink-0 flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-black/5 sm:h-[450px] sm:w-[320px] sm:max-w-none"
            >
              <div className="h-[64%] w-full shrink-0 animate-pulse rounded-t-[28px] bg-[#EAE4D7]" />
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                <div className="space-y-2.5">
                  <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-[#E8E2D5]" />
                  <div className="h-5 w-11/12 animate-pulse rounded-lg bg-[#D8D1C2]" />
                </div>
                <div className="h-10 w-full animate-pulse rounded-2xl bg-[#F6F3EC]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skeleton del Banner Institucional del Intendente */}
      <section className="overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-black/5">
        <div className="grid h-1.5 w-full grid-cols-4 bg-[#E8E2D5]" />
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-7 sm:flex-row sm:gap-5 sm:py-8">
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-[#EAE4D7]" />
          <div className="space-y-2 text-center sm:text-left">
            <div className="mx-auto h-3.5 w-44 animate-pulse rounded-full bg-[#F7EFE0] sm:mx-0" />
            <div className="mx-auto h-6 w-48 animate-pulse rounded-lg bg-[#E8E2D5] sm:mx-0" />
          </div>
        </div>
      </section>
    </div>
  );
}
