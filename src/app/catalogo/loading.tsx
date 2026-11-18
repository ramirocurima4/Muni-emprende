import {
  CatalogContentSkeleton,
  CatalogHeaderSkeleton,
} from "@/components/catalog/CatalogSkeleton";

export default function CatalogLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando catálogo de productos"
      className="relative z-0 mx-auto w-full max-w-6xl space-y-8 px-4 pt-8 pb-12 sm:space-y-10 sm:px-8 sm:pt-12 sm:pb-16"
    >
      <CatalogHeaderSkeleton />
      <CatalogContentSkeleton />
    </div>
  );
}
