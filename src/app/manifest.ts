import type { MetadataRoute } from "next";

/**
 * Web App Manifest oficial de MuniEmprende (PWA).
 * Next.js expone automáticamente este archivo en `/manifest.webmanifest`.
 *
 * NOTA PARA RAMIRO (Íconos Oficiales):
 * Los archivos `/public/icon-192x192.png` y `/public/icon-512x512.png` son
 * placeholders genéricos con la paleta municipal. Reemplazarlos en `/public`
 * manteniendo exactamente esos nombres y dimensiones (192x192 y 512x512 px).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MuniEmprende - Feria Digital de San Roque",
    short_name: "MuniEmprende",
    description:
      "Feria Digital de San Roque. Catálogo oficial de emprendedores y artesanos locales de la Municipalidad de San Roque.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FDFBF7",
    theme_color: "#3D7A1E",
    lang: "es-AR",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
