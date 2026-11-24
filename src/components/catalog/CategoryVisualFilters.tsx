import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ChefHat,
  Hammer,
  Laptop,
  LayoutGrid,
  Spool,
  Sprout,
  Store,
  Wrench,
} from "lucide-react";
import type { PublicCategoryItem } from "@/lib/catalog";

interface CategoryVisualFiltersProps {
  categories: PublicCategoryItem[];
  activeCategorySlug?: string;
  activeQuery?: string;
  activeEntrepreneurParam?: string;
  variant?: "home" | "catalog";
}

interface CategoryVisualMeta {
  icon: LucideIcon;
  shortLabel?: string;
}

const CATEGORY_VISUAL_MAP: Record<string, CategoryVisualMeta> = {
  gastronomia: { icon: ChefHat, shortLabel: "Gastronomía" },
  "artesanias-y-decoracion": { icon: Hammer, shortLabel: "Artesanías" },
  "textil-e-indumentaria": { icon: Spool, shortLabel: "Textil" },
  "vivero-y-jardineria": { icon: Sprout, shortLabel: "Vivero" },
  servicios: { icon: Wrench, shortLabel: "Servicios" },
  tecnologia: { icon: Laptop, shortLabel: "Tecnología" },
  otras: { icon: Store, shortLabel: "Otras" },
};

const KEYWORD_ICON_RULES: Array<[RegExp, LucideIcon]> = [
  [/gastro|comid|dulc|pan|ali/, ChefHat],
  [/artesan|decor|madera|ceram/, Hammer],
  [/textil|indument|ropa|tej/, Spool],
  [/vivero|jardin|plant|huert/, Sprout],
  [/tecno|celu|compu|electro/, Laptop],
  [/servic|oficio|taller/, Wrench],
];

function resolveCategoryVisual(slug: string): CategoryVisualMeta {
  const mapped = CATEGORY_VISUAL_MAP[slug];
  if (mapped) return mapped;

  const matchedRule = KEYWORD_ICON_RULES.find(([pattern]) =>
    pattern.test(slug),
  );
  return { icon: matchedRule ? matchedRule[1] : Store };
}

function buildCategoryHref(
  slug?: string,
  activeQuery?: string,
  activeEntrepreneurParam?: string,
): string {
  const params = new URLSearchParams();
  if (slug) {
    params.set("categoria", slug);
  }
  if (activeQuery) {
    params.set("q", activeQuery);
  }
  if (activeEntrepreneurParam) {
    params.set("emprendedor", activeEntrepreneurParam);
  }
  const qs = params.toString();
  return qs ? `/catalogo?${qs}` : "/catalogo";
}

/**
 * Filtros visuales por rubros con íconos vectoriales redondos de trazo fino (Lucide React),
 * equilibrados para todos los rubros del portal MuniEmprende San Roque.
 */
export function CategoryVisualFilters({
  categories,
  activeCategorySlug,
  activeQuery,
  activeEntrepreneurParam,
  variant = "catalog",
}: CategoryVisualFiltersProps) {
  if (variant === "home") {
    return (
      <nav
        aria-label="Categorías de productos"
        className="no-scrollbar -mx-5 flex items-start gap-4 overflow-x-auto px-5 py-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-8"
      >
        <Link
          href="/catalogo"
          className="group flex min-w-[74px] shrink-0 flex-col items-center gap-2 text-center focus:outline-none"
        >
          <span className="flex h-15 w-15 items-center justify-center rounded-full bg-brand-green text-white shadow-md shadow-brand-green/20 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-brand-green-hover group-focus-visible:ring-2 group-focus-visible:ring-brand-green group-focus-visible:ring-offset-2 sm:h-16 sm:w-16">
            <LayoutGrid className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="text-xs font-bold leading-tight text-brand-green">
            Todos
          </span>
        </Link>

        {categories.map((cat) => {
          const { icon: Icon, shortLabel } = resolveCategoryVisual(cat.slug);
          const label = shortLabel ?? cat.name;

          return (
            <Link
              key={cat.id}
              href={buildCategoryHref(cat.slug)}
              className="group flex min-w-[74px] shrink-0 flex-col items-center gap-2 text-center focus:outline-none"
            >
              <span className="flex h-15 w-15 items-center justify-center rounded-full border border-[#A8C6E3] bg-[#C5DCEF] text-brand-ink shadow-xs transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-brand-green/50 group-hover:bg-brand-green-soft group-hover:text-brand-green group-focus-visible:ring-2 group-focus-visible:ring-brand-green group-focus-visible:ring-offset-2 sm:h-16 sm:w-16">
                <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold leading-tight text-brand-ink group-hover:text-brand-green">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Filtrar por categoría"
      className="no-scrollbar flex items-center gap-2.5 overflow-x-auto py-1.5 sm:flex-wrap sm:gap-3"
    >
      <Link
        href={buildCategoryHref(undefined, activeQuery, activeEntrepreneurParam)}
        className={`group inline-flex shrink-0 items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 ${
          !activeCategorySlug
            ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
            : "border border-[#A8C6E3] bg-[#C5DCEF]/85 text-brand-ink hover:bg-[#B8D2EA] hover:text-brand-sky-dark"
        }`}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            !activeCategorySlug
              ? "bg-brand-amber text-brand-ink"
              : "bg-white/80 text-brand-ink group-hover:bg-white group-hover:text-brand-sky-dark"
          }`}
        >
          <LayoutGrid className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span>Todos los rubros</span>
      </Link>

      {categories.map((cat) => {
        const isSelected = cat.slug === activeCategorySlug;
        const { icon: Icon } = resolveCategoryVisual(cat.slug);

        return (
          <Link
            key={cat.id}
            href={buildCategoryHref(cat.slug, activeQuery, activeEntrepreneurParam)}
            className={`group inline-flex shrink-0 items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 ${
              isSelected
                ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                : "border border-[#A8C6E3] bg-[#C5DCEF]/85 text-brand-ink hover:bg-[#B8D2EA] hover:text-brand-sky-dark"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                isSelected
                  ? "bg-brand-amber text-brand-ink"
                  : "bg-white/80 text-brand-ink group-hover:bg-white group-hover:text-brand-sky-dark"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.65} aria-hidden="true" />
            </span>
            <span>{cat.name}</span>
            {cat.productCount > 0 ? (
              <span
                className={`text-[11px] ${
                  isSelected ? "text-brand-green-soft" : "text-brand-muted"
                }`}
              >
                ({cat.productCount})
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
