"use client";

import { LayoutGrid, Sprout, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavSectionItem {
  href: string;
  label: string;
  mobileLabel: string;
  icon: typeof LayoutGrid;
  isActive: (pathname: string) => boolean;
}

const SECTION_ITEMS: NavSectionItem[] = [
  {
    href: "/",
    label: "Catálogo",
    mobileLabel: "Catálogo",
    icon: LayoutGrid,
    isActive: (p) => p === "/" || p.startsWith("/catalogo") || p.startsWith("/productos"),
  },
  {
    href: "/expo-emprendedores",
    label: "Expo Emprendedores",
    mobileLabel: "Expo",
    icon: Store,
    isActive: (p) => p.startsWith("/expo-emprendedores"),
  },
  {
    href: "/mercado-sanroqueno",
    label: "Mercado Sanroqueño",
    mobileLabel: "Mercado",
    icon: Sprout,
    isActive: (p) => p.startsWith("/mercado-sanroqueno"),
  },
];

export function HeaderSectionLinks({
  variant,
}: {
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();

  if (variant === "desktop") {
    return (
      <nav
        aria-label="Secciones principales"
        className="hidden md:flex md:items-center md:gap-1 lg:gap-1.5"
      >
        {SECTION_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green lg:px-3 ${
                active
                  ? "bg-brand-green text-white shadow-sm"
                  : "text-brand-ink hover:bg-[#C5DCEF] hover:text-brand-sky-dark"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Accesos rápidos a secciones"
      className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-[#B8D2EA]/80 bg-[#C5DCEF]/75 px-3.5 py-2 md:hidden"
    >
      {SECTION_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.isActive(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold whitespace-nowrap shadow-2xs transition-colors ${
              active
                ? "border-brand-green bg-brand-green text-white"
                : "border-[#A6C4E0] bg-brand-surface text-brand-ink active:bg-brand-green-soft"
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${active ? "text-white" : "text-brand-green"}`}
              aria-hidden="true"
            />
            <span>{item.mobileLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
