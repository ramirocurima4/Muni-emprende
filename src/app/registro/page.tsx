import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Sumar mi emprendimiento",
  description:
    "Registrate como emprendedor local en el catálogo oficial de la Municipalidad de San Roque.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green-soft px-3.5 py-1 text-xs font-bold text-brand-green-dark">
          Inscripción Gratuita · San Roque
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
          Sumá tu emprendimiento a la feria
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:text-sm">
          Completá tus datos para publicar tus productos y recibir consultas
          directo en tu WhatsApp.
        </p>
      </div>

      <RegisterForm />

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
