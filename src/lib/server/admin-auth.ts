import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export class AdminAuthError extends Error {
  statusCode: 401 | 403;

  constructor(message: string, statusCode: 401 | 403) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface AdminContext {
  userId: string;
  username: string;
}

/**
 * Verifica que quien llama sea ADMIN **contra el estado vivo en PostgreSQL**
 * (rol + cuenta activa), sin confiar solo en el rol guardado dentro del JWT.
 * Se usa en cada Server Action y Route Handler del panel /admin.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const session = await getSession();
  if (!session) {
    console.warn("[admin-auth] Sesión ausente o token inválido al acceder a /admin.");
    throw new AdminAuthError(
      "Tu sesión se cerró. Volvé a ingresar con tu usuario.",
      401,
    );
  }

  let user: {
    id: string;
    username: string;
    role: UserRole;
    isActive: boolean;
  } | null = null;

  try {
    user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, role: true, isActive: true },
    });
  } catch (err) {
    console.error(
      "[admin-auth] Error al consultar el usuario en PostgreSQL:",
      { userId: session.userId, username: session.username },
      err,
    );
    throw err;
  }

  if (!user) {
    console.warn("[admin-auth] Usuario de la cookie no existe en PostgreSQL:", {
      userId: session.userId,
      username: session.username,
    });
    throw new AdminAuthError(
      "Tu sesión ya no es válida. Volvé a ingresar con tu usuario.",
      401,
    );
  }

  if (!user.isActive || user.role !== UserRole.ADMIN) {
    console.warn("[admin-auth] Acceso denegado a /admin:", {
      userId: user.id,
      username: user.username,
      dbRole: user.role,
      isActive: user.isActive,
      jwtRole: session.role,
    });
    throw new AdminAuthError(
      "No tenés permisos para usar el panel de administración.",
      403,
    );
  }

  return { userId: user.id, username: user.username };
}

/**
 * Variante para páginas Server Component: redirige en lugar de lanzar.
 * Los errores inesperados de base de datos se loguean y se propagan (no se ocultan tras una redirección).
 */
export async function requireAdminPage(): Promise<AdminContext> {
  let failure: AdminAuthError | null = null;

  try {
    return await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) {
      failure = err;
    } else {
      console.error("[admin-auth] Error inesperado en requireAdminPage:", err);
      throw err;
    }
  }

  const target = failure.statusCode === 401 ? "/login?next=/admin" : "/";
  console.warn(`[admin-auth] Redirigiendo desde /admin hacia ${target} (HTTP ${failure.statusCode}).`);
  redirect(target);
}

/**
 * Convierte cualquier error de una Server Action en un resultado `{ ok: false }`
 * con un mensaje en castellano claro.
 */
export function toActionError(
  err: unknown,
  fallback: string,
): { ok: false; error: string } {
  return {
    ok: false,
    error: err instanceof Error && err.message ? err.message : fallback,
  };
}
