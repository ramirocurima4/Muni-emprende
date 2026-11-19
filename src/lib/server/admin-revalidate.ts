import { revalidatePath, revalidateTag, updateTag } from "next/cache";

/**
 * Invalida cachés públicas y vistas del panel tras una mutación hecha desde /admin.
 * Debe llamarse únicamente desde Server Actions (usa `updateTag`).
 */
export function revalidateAdminMutation(options?: {
  productSlug?: string | null;
  expos?: boolean;
  fairs?: boolean;
  systemConfig?: boolean;
}): void {
  updateTag("public-catalog");
  updateTag("public-products");
  updateTag("public-categories");
  updateTag("public-entrepreneurs");
  if (options?.productSlug) {
    updateTag(`product-${options.productSlug}`);
    revalidatePath(`/productos/${options.productSlug}`);
  }
  if (options?.expos || options?.fairs || options?.systemConfig) {
    updateTag("public-expos");
    updateTag("public-fairs");
    updateTag("public-system-config");
  }
  revalidatePath("/expo-emprendedores");
  revalidatePath("/mercado-sanroqueno");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/galeria");
  revalidatePath("/mi-emprendimiento");
  revalidatePath("/login");
  revalidatePath("/catalogo");
  revalidatePath("/");
}

/**
 * Invalida cachés públicas y vistas de /admin desde Route Handlers (usa `revalidateTag`).
 */
export function revalidateAdminFairsFromRouteHandler(): void {
  revalidateTag("public-expos", { expire: 0 });
  revalidateTag("public-fairs", { expire: 0 });
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/galeria");
  revalidatePath("/expo-emprendedores");
  revalidatePath("/mercado-sanroqueno");
  revalidatePath("/");
}
