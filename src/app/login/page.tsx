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
    <div className="mx-auto flex w-full max-w-md flex-col px-3.5 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDE6DF] px-3 py-1 text-xs font-semibold text-[#273B2C]">
          Portal Oficial · San Roque
        </span>
        <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-[#2C302E]">
          Ingresar a MuniEmprende
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#5A615D]">
          Accedé a tu panel para gestionar tus productos o administrar el
          catálogo municipal.
        </p>
      </div>

      <LoginForm />

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
