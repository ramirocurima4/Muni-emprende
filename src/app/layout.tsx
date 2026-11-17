import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { HeaderAuthNav } from "@/components/layout/HeaderAuthNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0E4B27",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  applicationName: "MuniEmprende",
  title: {
    default: "MuniEmprende San Roque | Feria Digital de Emprendedores Locales",
    template: "%s | MuniEmprende San Roque",
  },
  description:
    "Catálogo oficial de emprendedores y artesanos de la Municipalidad de San Roque. Descubrí productos locales y contactá directo por WhatsApp.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MuniEmprende",
    statusBarStyle: "default",
  },
  // Placeholders en /public: Ramiro reemplazará /public/icon-192x192.png y /public/icon-512x512.png por los íconos oficiales
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    title: "MuniEmprende San Roque — Feria Digital de Emprendedores",
    description:
      "Apoyá el trabajo local en San Roque. Explorá gastronomía, artesanías, indumentaria y más, sin intermediarios.",
    locale: "es_AR",
    type: "website",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F6F3EC] text-[#1C2420]">
        <header className="sticky top-0 z-30 border-b border-[#E8E2D5]/70 bg-white/95 shadow-sm shadow-black/[0.03] backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5 sm:px-8 sm:py-3">
            <Link
              href="/"
              className="group flex items-center gap-3.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B27]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpeg"
                alt="San Roque Municipio"
                width={382}
                height={575}
                className="h-14 w-auto shrink-0 object-contain sm:h-16"
              />
              <div className="h-8 w-px bg-[#E8E2D5]" aria-hidden="true" />
              <div className="leading-tight">
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#9E8229]">
                  Feria Digital Oficial
                </span>
                <span className="block text-base font-extrabold tracking-tight text-[#0E4B27] transition-colors group-hover:text-[#0A381D] sm:text-lg">
                  MuniEmprende
                </span>
              </div>
            </Link>

            <Suspense
              fallback={
                <div className="h-9 w-28 animate-pulse rounded-xl bg-[#E8E2D5]/70" />
              }
            >
              <HeaderAuthNav />
            </Suspense>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-8 border-t border-[#E8E2D5] bg-[#FDFBF7]">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#1C2420]">
                  MuniEmprende — Municipalidad de San Roque
                </p>
                <p className="mt-0.5 text-xs text-[#525E57]">
                  Área de Modernización y Empleo · Catálogo Oficial de
                  Emprendedores Locales
                </p>
              </div>
              <div className="rounded-2xl border border-[#E8E2D5] bg-[#F6F3EC] px-4 py-3 text-xs leading-relaxed text-[#525E57] sm:max-w-md">
                <strong className="font-semibold text-[#1C2420]">
                  Aviso oficial:
                </strong>{" "}
                La Municipalidad de San Roque brinda únicamente este espacio de
                difusión publicitaria y no interviene en precios, medios de
                pago, entregas ni garantías comerciales.
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
