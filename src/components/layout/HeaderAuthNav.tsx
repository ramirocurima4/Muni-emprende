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
          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1C2420] transition-colors hover:bg-[#E6F0EA] hover:text-[#0E4B27]"
        >
          Catálogo
        </Link>

        <Link
          href={panelHref}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E4B27] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_-4px_rgba(14,75,39,0.28)] transition-all hover:bg-[#0A381D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B27] focus-visible:ring-offset-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#E6F0EA]" />
          <span>{panelLabel}</span>
        </Link>

        <span className="hidden md:inline-flex items-center rounded-lg border border-[#E8E2D5] bg-[#F6F3EC] px-2.5 py-1 text-[11px] font-medium text-[#525E57]">
          {session.email}
        </span>

        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-xl border border-[#E8E2D5] bg-[#FDFBF7] px-3 py-1.5 text-xs font-semibold text-[#525E57] transition-colors hover:border-[#D98282] hover:bg-[#FDF2F2] hover:text-[#7A1C1C]"
          >
            Salir
          </button>
        </form>
      </nav>
    );
  }

  return (
    <nav aria-label="Accesos públicos de cuenta" className="flex items-center gap-1.5 sm:gap-2.5">
      <Link
        href="/catalogo"
        className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1C2420] transition-colors hover:bg-[#E6F0EA] hover:text-[#0E4B27]"
      >
        Catálogo
      </Link>
      <Link
        href="/login"
        className="rounded-xl border border-[#E8E2D5] bg-[#FDFBF7] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] transition-colors hover:bg-[#E6F0EA] hover:text-[#0E4B27]"
      >
        Ingresar
      </Link>
      <Link
        href="/registro"
        className="hidden sm:inline-flex rounded-xl bg-[#0E4B27] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_-4px_rgba(14,75,39,0.25)] transition-all hover:bg-[#0A381D]"
      >
        Soy emprendedor
      </Link>
    </nav>
  );
}
