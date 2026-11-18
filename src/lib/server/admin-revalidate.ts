import { revalidatePath, updateTag } from "next/cache";

/**
 * Invalida cachés públicas y vistas del panel tras una mutación hecha desde /admin.
 * Debe llamarse únicamente desde Server Actions (usa `updateTag`).
 */
export function revalidateAdminMutation(options?: {
  productSlug?: string | null;
  expos?: boolean;
}): void {
  updateTag("public-catalog");
  updateTag("public-products");
  updateTag("public-categories");
  if (options?.productSlug) {
    updateTag(`product-${options.productSlug}`);
    revalidatePath(`/productos/${options.productSlug}`);
  }
  if (options?.expos) {
    updateTag("public-expos");
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/mi-emprendimiento");
  revalidatePath("/catalogo");
  revalidatePath("/");
}
