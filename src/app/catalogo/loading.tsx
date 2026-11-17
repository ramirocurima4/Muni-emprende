import {
  CatalogContentSkeleton,
  CatalogHeaderSkeleton,
} from "@/components/catalog/CatalogSkeleton";

export default function CatalogLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando catálogo de productos"
      className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-8 sm:py-12"
    >
      <CatalogHeaderSkeleton />
      <CatalogContentSkeleton />
    </div>
  );
}
