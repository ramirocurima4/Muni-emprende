import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import { SystemConfigForm } from "@/components/admin/SystemConfigForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/server/admin-auth";
import { getPublicSystemConfig } from "@/lib/system-config";

export const metadata: Metadata = {
  title: "Configuración / Áreas · Panel de Administración",
};

export default function AdminConfigPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminConfigContent />
    </Suspense>
  );
}

async function AdminConfigContent() {
  await requireAdminPage();
  const config = await getPublicSystemConfig();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración / Áreas"
        description="Administrá en vivo los teléfonos oficiales de WhatsApp de la Dirección de Empleo y Producción, la cartelera de próximas ferias y los datos institucionales sin tocar código."
      />

      <SystemConfigForm config={config} />
    </div>
  );
}
