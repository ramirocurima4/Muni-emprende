import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EntrepreneurPanel } from "@/components/mi-emprendimiento/EntrepreneurPanel";
import {
  loadEntrepreneurPanelCollections,
  mapPanelEntrepreneurProfile,
  PanelAuthError,
  requireAuthenticatedEntrepreneur,
} from "@/lib/server/entrepreneur-panel";
import { getSession, isEntrepreneurRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mi Emprendimiento · Panel del Emprendedor",
};

export default function MiEmprendimientoPage() {
  return (
    <Suspense fallback={<MiEmprendimientoSkeleton />}>
      <MiEmprendimientoContent />
    </Suspense>
  );
}

function MiEmprendimientoSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="h-36 animate-pulse rounded-[28px] bg-white/75" />
      <div className="h-96 animate-pulse rounded-[28px] bg-white/75" />
      <div className="h-16 animate-pulse rounded-[26px] bg-brand-green/25" />
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-[26px] bg-white/75" />
        <div className="h-36 animate-pulse rounded-[26px] bg-white/75" />
      </div>
    </div>
  );
}

async function MiEmprendimientoContent() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/mi-emprendimiento");
  }

  if (!isEntrepreneurRole(session.role)) {
    redirect(session.role === "ADMIN" ? "/admin" : "/");
  }

  let context: Awaited<ReturnType<typeof requireAuthenticatedEntrepreneur>>;
  try {
    context = await requireAuthenticatedEntrepreneur();
  } catch (err) {
    if (err instanceof PanelAuthError && err.statusCode === 403) {
      redirect("/login");
    }
    redirect("/login");
  }

  const { products, categories } = await loadEntrepreneurPanelCollections(
    context.entrepreneur.id,
  );

  return (
    <EntrepreneurPanel
      initialProfile={mapPanelEntrepreneurProfile(context)}
      initialProducts={products}
      categories={categories}
    />
  );
}
