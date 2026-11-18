import { EntrepreneurStatus, ProductStatus } from "@prisma/client";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/server/admin-auth";
import { AdminSidebarNav } from "./AdminSidebarNav";

/**
 * Barra lateral del panel. Verifica ADMIN contra la base y muestra cuántas
 * cosas esperan revisión municipal.
 */
export async function AdminSidebar() {
  const admin = await requireAdminPage();

  const [pendingProducts, pendingEntrepreneurs] = await Promise.all([
    db.product.count({ where: { status: ProductStatus.PENDING } }),
    db.entrepreneur.count({ where: { status: EntrepreneurStatus.PENDING } }),
  ]);

  return (
    <div className="space-y-5">
      <AdminSidebarNav moderationPending={pendingProducts + pendingEntrepreneurs} />

      <div className="rounded-2xl bg-white/80 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
          Sesión iniciada
        </p>
        <p className="mt-0.5 truncate text-sm font-extrabold text-brand-ink">
          @{admin.username}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex min-h-[38px] items-center justify-center rounded-xl border border-brand-sky/40 bg-white px-3 py-1.5 text-xs font-bold text-brand-sky-dark transition-colors hover:bg-brand-sky-light"
          >
            Ver el sitio público ↗
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-white px-3 py-1.5 text-xs font-bold text-brand-muted transition-colors hover:border-[#D98282] hover:bg-[#FDF2F2] hover:text-[#7A1C1C]"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebarSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="h-[46px] animate-pulse rounded-2xl bg-white/70" />
      ))}
    </div>
  );
}
