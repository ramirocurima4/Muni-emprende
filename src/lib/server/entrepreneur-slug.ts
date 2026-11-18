import { db } from "@/lib/db";
import { slugifyText } from "@/lib/slug";

/**
 * Genera un slug único para un emprendimiento a partir de su nombre comercial.
 * Compartido por el registro público y la creación de usuarios desde /admin.
 */
export async function generateUniqueEntrepreneurSlug(
  businessName: string,
): Promise<string> {
  const baseSlug = slugifyText(businessName, "emprendimiento");
  const existing = await db.entrepreneur.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existing) {
    return baseSlug;
  }

  for (let attempt = 2; attempt <= 50; attempt++) {
    const candidate = `${baseSlug}-${attempt}`;
    const found = await db.entrepreneur.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!found) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}
