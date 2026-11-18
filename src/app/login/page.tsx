import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Ingresar",
  description:
    "Acceso para emprendedores locales y equipo de moderación de la Municipalidad de San Roque.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green-soft px-3.5 py-1 text-xs font-bold text-brand-green-dark">
          Portal Oficial · San Roque
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
          Ingresar a MuniEmprende
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:text-sm">
          Accedé con tu nombre de usuario y contraseña para gestionar tus
          productos.
        </p>
      </div>

      <LoginForm />

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs font-semibold text-brand-muted transition-colors hover:text-brand-green-dark"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
