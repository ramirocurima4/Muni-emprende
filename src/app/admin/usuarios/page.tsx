import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import { CreateUserPanel } from "@/components/admin/CreateUserPanel";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";
import {
  PageHeader,
  Panel,
  SectionTitle,
  StatusBadge,
} from "@/components/admin/ui";
import { UserActiveToggleButton } from "@/components/admin/UserActiveToggleButton";
import { formatDate, ROLE_LABELS } from "@/lib/admin-labels";
import { requireAdminPage } from "@/lib/server/admin-auth";
import { getStaffUsers } from "@/lib/server/admin-data";

export const metadata: Metadata = {
  title: "Usuarios del equipo · Panel de Administración",
};

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminUsersContent />
    </Suspense>
  );
}

async function AdminUsersContent() {
  const admin = await requireAdminPage();
  const staff = await getStaffUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios del equipo y altas rápidas"
        description="Creá usuarios de cualquier tipo con contraseña automática y administrá el acceso del equipo municipal."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <Panel className="lg:col-span-6">
          <SectionTitle
            title="Crear nuevo usuario"
            description="Podés dar de alta personal municipal o emprendimientos directamente."
          />
          <CreateUserPanel />
        </Panel>

        <Panel className="lg:col-span-6">
          <SectionTitle
            title="Equipo municipal"
            description="Cuentas con rol de Administración o Moderación. Para emprendedores usá la sección Emprendedores."
            count={staff.length}
          />

          <ul className="divide-y divide-brand-border">
            {staff.map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-brand-ink">
                      @{member.username}
                    </span>
                    <StatusBadge
                      label={ROLE_LABELS[member.role] ?? member.role}
                      tone={member.role === "ADMIN" ? "green" : "sky"}
                    />
                    <StatusBadge
                      label={member.isActive ? "Activo" : "Sin acceso"}
                      tone={member.isActive ? "green" : "red"}
                    />
                  </div>
                  <p className="mt-1 text-xs text-brand-muted">
                    Creado el {formatDate(member.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ResetPasswordButton
                    userId={member.id}
                    username={member.username}
                    compact
                  />
                  <UserActiveToggleButton
                    userId={member.id}
                    username={member.username}
                    isActive={member.isActive}
                    isSelf={member.id === admin.userId}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
