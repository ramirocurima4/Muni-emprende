import type { PublicProductCardItem } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

interface MasonryCatalogGridProps {
  products: PublicProductCardItem[];
}

/**
 * Grilla responsive uniforme para el catálogo público:
 * 2 columnas en móvil, 3 en tablet y 4 en desktop, preservando CLS = 0.
 */
export function MasonryCatalogGrid({ products }: MasonryCatalogGridProps) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-3.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 8}
        />
      ))}
    </div>
  );
}
