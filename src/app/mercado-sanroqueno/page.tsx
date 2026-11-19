import type { Metadata } from "next";
import { Suspense } from "react";
import {
  FairPortalPage,
  FairPortalSkeleton,
} from "@/components/fairs/FairPortalPage";

export const metadata: Metadata = {
  title: "Mercado Sanroqueño",
  description:
    "Crónicas, fotos y próximas jornadas del Mercado Sanroqueño: productores locales de frutas, verduras, huevos y granja.",
};

export default function MercadoSanroquenoPage() {
  return (
    <Suspense fallback={<FairPortalSkeleton />}>
      <FairPortalPage fairType="MERCADO_SANROQUENO" />
    </Suspense>
  );
}
