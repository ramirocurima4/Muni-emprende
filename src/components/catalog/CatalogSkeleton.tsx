export function CatalogHeaderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-[32px] bg-white px-6 py-7 shadow-2xl shadow-black/5 sm:px-10 sm:py-9"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="h-7 w-32 animate-pulse rounded-full bg-[#F6F3EC]" />
        <div className="h-7 w-44 animate-pulse rounded-full bg-[#E6F0EA]" />
      </div>
      <div className="mt-4 h-8 w-72 max-w-full animate-pulse rounded-xl bg-[#E8E2D5]" />
      <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded-lg bg-[#F6F3EC]" />
    </div>
  );
}

export function CatalogContentSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-hidden="true">
      {/* Buscador + pastillas de categoría */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 flex-1 animate-pulse rounded-2xl bg-white shadow-xl shadow-black/5" />
          <div className="h-12 w-24 shrink-0 animate-pulse rounded-2xl bg-[#D8D1C2]" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-28 animate-pulse rounded-full bg-[#D8D1C2]" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-white shadow-sm shadow-black/5" />
          <div className="h-8 w-36 animate-pulse rounded-full bg-white shadow-sm shadow-black/5" />
          <div className="h-8 w-32 animate-pulse rounded-full bg-white shadow-sm shadow-black/5" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-white shadow-sm shadow-black/5" />
        </div>
      </div>

      {/* Esqueleto de Grilla Masonry (2 cols móvil, 3 tablet, 4 desktop) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
        {[
          "aspect-[3/4]",
          "aspect-[4/5]",
          "aspect-[2/3]",
          "aspect-square",
          "aspect-[4/5]",
          "aspect-[3/4]",
          "aspect-square",
          "aspect-[3/4]",
        ].map((ratio, idx) => (
          <div
            key={idx}
            className={`overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-black/5 ${
              idx >= 6 ? "hidden lg:block" : idx >= 4 ? "hidden md:block" : ""
            }`}
          >
            <div className={`${ratio} w-full animate-pulse bg-[#EAE4D7]`} />
            <div className="space-y-2.5 p-3.5 sm:p-5">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#E8E2D5]" />
              <div className="h-4 w-full animate-pulse rounded-full bg-[#D8D1C2]" />
              <div className="h-9 w-full animate-pulse rounded-2xl bg-[#F6F3EC]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
