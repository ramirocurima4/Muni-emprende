import Link from "next/link";
import { connection } from "next/server";
import { logoutAction } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { getSession, isEntrepreneurRole } from "@/lib/session";

const NAV_PRIMARY_ACTION_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E4C268] bg-[#F7E09B] px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-brand-ink shadow-xs transition-colors hover:border-[#D9B14E] hover:bg-[#F2D57E] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 sm:px-4 sm:py-2 sm:text-xs";

export async function HeaderAuthNav() {
  await connection();
  const session = await getSession();

  if (session) {
    const liveUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, isActive: true, username: true },
    });

    if (liveUser && liveUser.isActive) {
      const isAdmin = liveUser.role === "ADMIN";
      const hasPanel = isAdmin || isEntrepreneurRole(liveUser.role);
      const panelHref = isAdmin ? "/admin" : "/mi-emprendimiento";
      const panelLabel = isAdmin ? "Panel de Administración" : "Mi Emprendimiento";

      return (
        <nav
          aria-label="Navegación interna de sesión"
          className="flex shrink-0 items-center gap-1.5 sm:gap-2.5"
        >
          {hasPanel ? (
            <Link href={panelHref} className={NAV_PRIMARY_ACTION_CLASS}>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-brand-green"
              />
              <span>{panelLabel}</span>
            </Link>
          ) : null}

          <span className="hidden lg:inline-flex items-center rounded-lg border border-brand-sky/35 bg-brand-surface px-2.5 py-1 text-[11px] font-medium text-brand-muted">
            @{liveUser.username}
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
  }

  return (
    <nav
      aria-label="Accesos públicos de cuenta"
      className="flex shrink-0 items-center gap-1.5 sm:gap-2.5"
    >
      <Link href="/login" className={NAV_PRIMARY_ACTION_CLASS}>
        Acceso Emprendedores
      </Link>
    </nav>
  );
}
