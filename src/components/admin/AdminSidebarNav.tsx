"use client";

import {
  ChartColumn,
  ClipboardCheck,
  History,
  Images,
  LayoutDashboard,
  Store,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "moderation";
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/admin/moderacion", label: "Moderación", icon: ClipboardCheck, badgeKey: "moderation" },
  { href: "/admin/emprendedores", label: "Emprendedores", icon: Store },
  { href: "/admin/galeria", label: "Galería de Expos", icon: Images },
  { href: "/admin/metricas", label: "Métricas", icon: ChartColumn },
  { href: "/admin/actividad", label: "Actividad", icon: History },
  { href: "/admin/usuarios", label: "Usuarios del equipo", icon: UserCog },
];

export function AdminSidebarNav({
  moderationPending,
}: {
  moderationPending: number;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel de administración" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        const badge = item.badgeKey === "moderation" ? moderationPending : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[46px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${
              active
                ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                : "text-brand-ink hover:bg-white/80"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {badge > 0 ? (
              <span
                className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-extrabold ${
                  active
                    ? "bg-white text-brand-green-dark"
                    : "bg-brand-amber text-brand-ink"
                }`}
                aria-label={`${badge} pendientes`}
              >
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
