import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  isEntrepreneurRole,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  const isEntrepreneurPanelRoute =
    pathname === "/mi-emprendimiento" ||
    pathname.startsWith("/mi-emprendimiento/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthPage = pathname === "/login" || pathname === "/registro";

  // La autorización definitiva por rol se valida contra la base de datos viva en cada página y acción.
  // En middleware solo exigimos sesión válida para evitar bloqueos por cookies con un rol desactualizado.
  if (isEntrepreneurPanelRoute || isAdminRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (isAuthPage && session) {
    // Si llega con ?next=... (ej. cambio de cuenta o re-login hacia /admin), permitimos mostrar el formulario.
    if (pathname === "/login" && searchParams.has("next")) {
      return NextResponse.next();
    }

    const target =
      session.role === "ADMIN"
        ? "/admin"
        : isEntrepreneurRole(session.role)
          ? "/mi-emprendimiento"
          : "/";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/mi-emprendimiento/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/registro",
  ],
};
