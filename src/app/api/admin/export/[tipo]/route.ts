import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import {
  ENTREPRENEUR_STATUS_LABELS,
  PRODUCT_STATUS_LABELS,
  formatDate,
  formatWhatsappDisplay,
} from "@/lib/admin-labels";
import {
  listEntrepreneursForExport,
  listProductsForExport,
} from "@/lib/server/admin-data";
import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { entrepreneursFilterSchema } from "@/lib/validations/admin";

/**
 * Exporta listados a CSV (compatible con Excel es-AR).
 * Solo ADMIN. `tipo` = `emprendedores` (respeta filtros de la pantalla) | `productos`.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ tipo: string }> },
) {
  try {
    await requireAdmin();
  } catch (err) {
    const status = err instanceof AdminAuthError ? err.statusCode : 401;
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status });
  }

  const { tipo } = await context.params;
  const stamp = new Date().toISOString().slice(0, 10);
  let csv: string;
  let filename: string;

  if (tipo === "emprendedores") {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const filter = entrepreneursFilterSchema.parse(params);
    const rows = await listEntrepreneursForExport(filter);

    csv = toCsv(
      [
        "Emprendimiento",
        "Responsable",
        "Usuario",
        "WhatsApp",
        "Barrio o zona",
        "Estado",
        "Permiso de publicación",
        "Productos publicados",
        "Fecha de alta",
      ],
      rows.map((row) => [
        row.businessName,
        row.ownerName,
        row.user.username,
        formatWhatsappDisplay(row.whatsappNumber),
        row.neighborhood,
        ENTREPRENEUR_STATUS_LABELS[row.status]?.label ?? row.status,
        row.trusted ? "Publicación directa" : "Con revisión previa",
        row.publishedProducts,
        formatDate(row.createdAt),
      ]),
    );
    filename = `emprendedores-${stamp}.csv`;
  } else if (tipo === "productos") {
    const rows = await listProductsForExport();
    csv = toCsv(
      ["Producto", "Rubro", "Emprendimiento", "Barrio o zona", "Estado", "Fecha de carga", "Vence"],
      rows.map((row) => [
        row.title,
        row.category.name,
        row.entrepreneur.businessName,
        row.entrepreneur.neighborhood,
        PRODUCT_STATUS_LABELS[row.status]?.label ?? row.status,
        formatDate(row.createdAt),
        row.expiresAt ? formatDate(row.expiresAt) : "",
      ]),
    );
    filename = `productos-${stamp}.csv`;
  } else {
    return NextResponse.json({ ok: false, error: "Listado inexistente." }, { status: 404 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
