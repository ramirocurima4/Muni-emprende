import type { Metadata } from "next";
import { Suspense } from "react";
import {
  FairPortalPage,
  FairPortalSkeleton,
} from "@/components/fairs/FairPortalPage";

export const metadata: Metadata = {
  title: "Expo Emprendedores",
  description:
    "Crónicas, fotos y próximas fechas de la Expo Emprendedores de San Roque, organizada por la Dirección de Empleo de la Municipalidad.",
};

export default function ExpoEmprendedoresPage() {
  return (
    <Suspense fallback={<FairPortalSkeleton />}>
      <FairPortalPage fairType="EXPO_EMPRENDEDORES" />
    </Suspense>
  );
}
