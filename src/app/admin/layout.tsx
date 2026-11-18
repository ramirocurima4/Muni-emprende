import { Monitor } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import {
  AdminSidebar,
  AdminSidebarSkeleton,
} from "@/components/admin/AdminSidebar";

/**
 * Pantalla amable para celulares (< 768px): la gestión administrativa se hace desde una PC.
 * El acceso real lo controlan el rol ADMIN y las verificaciones en servidor.
 */
function MobileDesktopOnlyNotice() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-10 md:hidden">
      <div className="w-full max-w-sm rounded-[28px] border border-brand-sky/30 bg-white p-7 text-center shadow-xl shadow-brand-sky/10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-sky-light text-brand-sky-dark">
          <Monitor className="h-8 w-8" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-extrabold text-brand-ink">
          Esta pantalla es para usar desde una computadora
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-brand-muted">
          La gestión del portal (revisar productos, administrar emprendedores y
          subir fotos de la Expo) se hace desde una PC, para que puedas ver
          todo con comodidad.
        </p>
        <p className="mt-2 text-sm font-semibold text-brand-ink">
          ¡Ingresá de nuevo desde tu compu y listo!
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-brand-green px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-green/20 transition-colors hover:bg-brand-green-hover"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileDesktopOnlyNotice />

      <div className="hidden md:block">
        <div className="mx-auto flex w-full max-w-[1400px] items-start gap-6 px-6 py-6 lg:gap-8 lg:px-8">
          <aside className="sticky top-24 w-60 shrink-0 lg:w-64">
            <Suspense fallback={<AdminSidebarSkeleton />}>
              <AdminSidebar />
            </Suspense>
          </aside>

          <div className="min-w-0 flex-1 space-y-6">{children}</div>
        </div>
      </div>
    </>
  );
}
