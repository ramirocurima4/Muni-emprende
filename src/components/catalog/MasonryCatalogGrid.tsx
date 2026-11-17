import type { PublicProductCardItem } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

interface MasonryCatalogGridProps {
  products: PublicProductCardItem[];
}

/**
 * Distribuye los productos en N columnas balanceando la altura acumulada
 * estimada a partir del aspect-ratio (height / width) guardado en PostgreSQL.
 * Esto preserva el orden de lectura izquierda-derecha y garantiza CLS = 0.
 */
function distributeIntoBalancedColumns(
  items: PublicProductCardItem[],
  columnCount: number,
): Array<Array<{ item: PublicProductCardItem; index: number }>> {
  const columns: Array<Array<{ item: PublicProductCardItem; index: number }>> =
    Array.from({ length: columnCount }, () => []);
  const columnHeights = Array.from({ length: columnCount }, () => 0);

  // Peso fijo relativo estimado del bloque inferior de texto + botón de cada tarjeta
  const CARD_BODY_WEIGHT = 0.55;

  items.forEach((item, index) => {
    const width = item.primaryImage?.width || 900;
    const height = item.primaryImage?.height || 1200;
    const imageRatio = Math.min(Math.max(height / width, 0.5), 2.0);
    const totalCardWeight = imageRatio + CARD_BODY_WEIGHT;

    let shortestColIndex = 0;
    for (let col = 1; col < columnCount; col++) {
      if (columnHeights[col] < columnHeights[shortestColIndex]) {
        shortestColIndex = col;
      }
    }

    columns[shortestColIndex].push({ item, index });
    columnHeights[shortestColIndex] += totalCardWeight;
  });

  return columns;
}

export function MasonryCatalogGrid({ products }: MasonryCatalogGridProps) {
  const cols2 = distributeIntoBalancedColumns(products, 2);
  const cols3 = distributeIntoBalancedColumns(products, 3);
  const cols4 = distributeIntoBalancedColumns(products, 4);

  return (
    <div>
      {/* Mobile-First: 2 columnas balanceadas (< 768px) */}
      <div className="grid grid-cols-2 items-start gap-3 md:hidden">
        {cols2.map((col, colIdx) => (
          <div key={`m2-col-${colIdx}`} className="flex flex-col gap-3">
            {col.map(({ item, index }) => (
              <ProductCard
                key={item.id}
                product={item}
                priority={index < 4}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tablet: 3 columnas balanceadas (768px - 1023px) */}
      <div className="hidden md:grid md:grid-cols-3 md:items-start md:gap-4 lg:hidden">
        {cols3.map((col, colIdx) => (
          <div key={`m3-col-${colIdx}`} className="flex flex-col gap-4">
            {col.map(({ item, index }) => (
              <ProductCard
                key={item.id}
                product={item}
                priority={index < 6}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Desktop: 4 columnas balanceadas (>= 1024px) */}
      <div className="hidden lg:grid lg:grid-cols-4 lg:items-start lg:gap-5">
        {cols4.map((col, colIdx) => (
          <div key={`m4-col-${colIdx}`} className="flex flex-col gap-5">
            {col.map(({ item, index }) => (
              <ProductCard
                key={item.id}
                product={item}
                priority={index < 8}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
