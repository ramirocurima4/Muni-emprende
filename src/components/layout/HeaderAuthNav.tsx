import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getSession } from "@/lib/session";

export async function HeaderAuthNav() {
  const session = await getSession();

  if (session) {
    const isStaff =
      session.role === "ADMIN" || session.role === "MODERATOR";
    const panelHref = isStaff ? "/admin" : "/dashboard";
    const panelLabel = isStaff ? "Panel Modernización" : "Mi Emprendimiento";

    return (
      <nav
        aria-label="Navegación interna de sesión"
        className="flex items-center gap-1.5 sm:gap-2.5"
      >
        <Link
          href="/catalogo"
          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-ink transition-colors hover:bg-white/75 hover:text-brand-green"
        >
          Catálogo
        </Link>

        <Link
          href={panelHref}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-3.5 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_-4px_rgba(61,122,30,0.3)] transition-all hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-amber-gold" />
          <span>{panelLabel}</span>
        </Link>

        <span className="hidden md:inline-flex items-center rounded-lg border border-brand-sky/35 bg-brand-surface px-2.5 py-1 text-[11px] font-medium text-brand-muted">
          @{session.username}
        </span>

        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-xl border border-brand-sky/35 bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-muted transition-colors hover:border-[#D98282] hover:bg-[#FDF2F2] hover:text-[#7A1C1C]"
          >
            Salir
          </button>
        </form>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Accesos públicos de cuenta"
      className="flex items-center gap-1.5 sm:gap-2.5"
    >
      <Link
        href="/catalogo"
        className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand-green-soft/60 hover:text-brand-green-dark sm:px-3"
      >
        Catálogo
      </Link>
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-xl border border-brand-green/65 bg-transparent px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-brand-green-dark transition-colors hover:border-brand-green hover:bg-brand-green-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 sm:px-4 sm:py-2 sm:text-xs"
      >
        Acceso Emprendedores
      </Link>
    </nav>
  );
}
