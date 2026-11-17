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
    <div className="mx-auto flex w-full max-w-xl flex-col px-3.5 py-7 sm:px-6 sm:py-10">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDE6DF] px-3 py-1 text-xs font-semibold text-[#273B2C]">
          Inscripción Gratuita · San Roque
        </span>
        <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-[#2C302E] sm:text-3xl">
          Sumá tu emprendimiento a la feria
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#5A615D]">
          Completá tus datos para publicar tus productos y recibir consultas
          directo en tu WhatsApp.
        </p>
      </div>

      <RegisterForm />

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs font-semibold text-[#5A615D] hover:text-[#2C302E]"
        >
          ← Volver al catálogo público
        </Link>
      </div>
    </div>
  );
}
