import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
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
  themeColor: "#3D7A1E",
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
      <body className="min-h-full flex flex-col bg-brand-cream text-brand-ink">
        <header className="sticky top-0 z-30 border-b border-brand-border/75 bg-brand-cream/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 px-3.5 py-2.5 sm:gap-4 sm:px-8 sm:py-3">
            <Link
              href="/"
              className="group flex min-w-0 items-center gap-2.5 rounded-xl py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green sm:gap-3.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-san-roque.png"
                alt="San Roque Municipio"
                width={370}
                height={583}
                className="municipal-shield-green h-14 w-auto shrink-0 object-contain sm:h-16"
              />
              <div
                className="hidden h-8 w-px bg-brand-sky/40 sm:block"
                aria-hidden="true"
              />
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-[10px] font-bold uppercase tracking-[0.12em] text-brand-sky-dark sm:hidden">
                  San Roque
                </span>
                <span className="hidden truncate text-[11px] font-bold uppercase tracking-[0.14em] text-brand-sky-dark sm:block">
                  Dir. de Empleo y Emprendedores
                </span>
                <span className="block truncate text-sm font-extrabold tracking-tight text-brand-green-dark transition-colors group-hover:text-brand-green sm:text-lg">
                  MuniEmprende
                </span>
              </div>
            </Link>

            <Suspense
              fallback={
                <div className="h-9 w-28 animate-pulse rounded-xl bg-brand-sky/25" />
              }
            >
              <HeaderAuthNav />
            </Suspense>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <Footer />
      </body>
    </html>
  );
}
