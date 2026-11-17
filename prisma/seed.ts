import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import {
  AuditEntityType,
  EntrepreneurStatus,
  ProductStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { db, pool } from "../src/lib/db";

async function generateSeedWebpVariants(
  relativePath: string,
  width: number,
  height: number,
  label: string,
  bgHex: string,
): Promise<void> {
  const uploadRoot = path.resolve(
    process.cwd(),
    process.env.UPLOAD_DIR ?? "./storage/uploads",
  );
  const fullTarget = path.join(uploadRoot, `${relativePath}_full.webp`);
  const thumbTarget = path.join(uploadRoot, `${relativePath}_thumb.webp`);

  await fs.mkdir(path.dirname(fullTarget), { recursive: true });

  const safeLabel = label.replace(/[<>&"']/g, "");
  const svgBuffer = Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgHex}" />
      <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="20" fill="none" stroke="#3F5E47" stroke-opacity="0.22" stroke-width="3" />
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="600" fill="#2C302E">${safeLabel}</text>
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#5A615D">${width} × ${height} WebP</text>
    </svg>`,
  );

  await sharp(svgBuffer).webp({ quality: 82 }).toFile(fullTarget);

  const thumbWidth = Math.min(480, width);
  const thumbHeight = Math.round((height / width) * thumbWidth);
  await sharp(svgBuffer)
    .resize(thumbWidth, thumbHeight)
    .webp({ quality: 78 })
    .toFile(thumbTarget);
}

const INITIAL_CATEGORIES = [
  { name: "Gastronomía", slug: "gastronomia", sortOrder: 1 },
  {
    name: "Artesanías y Decoración",
    slug: "artesanias-y-decoracion",
    sortOrder: 2,
  },
  {
    name: "Textil e Indumentaria",
    slug: "textil-e-indumentaria",
    sortOrder: 3,
  },
  { name: "Vivero y Jardinería", slug: "vivero-y-jardineria", sortOrder: 4 },
  { name: "Servicios", slug: "servicios", sortOrder: 5 },
  { name: "Tecnología", slug: "tecnologia", sortOrder: 6 },
  { name: "Otras", slug: "otras", sortOrder: 7 },
] as const;

async function main() {
  console.log("🌱 Iniciando seed de MuniEmprende San Roque...");

  const now = new Date();
  const adminPasswordPlain =
    process.env.SEED_ADMIN_PASSWORD ?? "MuniSanRoque2026!";
  const entrepreneurPasswordPlain =
    process.env.SEED_DEMO_PASSWORD ?? "EmprendeSanRoque2026!";

  const [adminPasswordHash, entrepreneurPasswordHash] = await Promise.all([
    bcrypt.hash(adminPasswordPlain, 12),
    bcrypt.hash(entrepreneurPasswordPlain, 12),
  ]);

  // 1. Usuario ADMIN Municipal
  const adminUser = await db.user.upsert({
    where: { username: "modernizacion" },
    update: {
      email: "modernizacion@munisanroque.ar",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      username: "modernizacion",
      email: "modernizacion@munisanroque.ar",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`✔ Usuario ADMIN listo: ${adminUser.username}`);

  // 2. Categorías Oficiales
  const categoryMap = new Map<string, string>();
  for (const cat of INITIAL_CATEGORIES) {
    const record = await db.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`✔ ${categoryMap.size} categorías oficiales cargadas.`);

  // 3. Usuario + Emprendedor de Prueba (APPROVED)
  const demoUser = await db.user.upsert({
    where: { username: "feria.donroque" },
    update: {
      email: "feria.donroque@munisanroque.ar",
      passwordHash: entrepreneurPasswordHash,
      role: UserRole.USER_TRUSTED,
      isActive: true,
    },
    create: {
      username: "feria.donroque",
      email: "feria.donroque@munisanroque.ar",
      passwordHash: entrepreneurPasswordHash,
      role: UserRole.USER_TRUSTED,
      isActive: true,
    },
  });

  const demoEntrepreneur = await db.entrepreneur.upsert({
    where: { slug: "manos-del-santa-lucia" },
    update: {
      businessName: "Manos del Santa Lucía",
      ownerName: "María Elena Gómez",
      whatsappNumber: "5493777554433",
      neighborhood: "Barrio Centro, San Roque",
      bio: "Elaboración artesanal de dulces regionales, tejidos tradicionales y productos de huerta familiar en San Roque.",
      status: EntrepreneurStatus.APPROVED,
      approvedAt: now,
      approvedById: adminUser.id,
      rejectionReason: null,
    },
    create: {
      userId: demoUser.id,
      businessName: "Manos del Santa Lucía",
      slug: "manos-del-santa-lucia",
      ownerName: "María Elena Gómez",
      whatsappNumber: "5493777554433",
      neighborhood: "Barrio Centro, San Roque",
      bio: "Elaboración artesanal de dulces regionales, tejidos tradicionales y productos de huerta familiar en San Roque.",
      status: EntrepreneurStatus.APPROVED,
      approvedAt: now,
      approvedById: adminUser.id,
    },
  });
  console.log(
    `✔ Emprendedor de prueba listo: ${demoEntrepreneur.businessName} (${demoEntrepreneur.status})`,
  );

  // 4. Cinco productos variados con distintos aspect ratios para maquetar Masonry Grid
  const sampleProducts = [
    {
      title: "Dulce de Mamón Casero en Almíbar (Frasco 500g)",
      slug: "dulce-de-mamon-casero-en-almibar-500g",
      categorySlug: "gastronomia",
      description:
        "Dulce de mamón elaborado a leña con fruta seleccionada de quintas locales de San Roque. Sin conservantes artificiales.",
      ingredients: "Mamón fresco de quinta, azúcar, clavo de olor y agua.",
      expiresAt: new Date(now.getTime() + 10 * 60 * 60 * 1000), // Vence hoy (+10h)
      image: {
        relativePath: "products/2026/11/seed-dulce-mamon",
        width: 900,
        height: 1200, // Aspect ratio 3:4 (Vertical clásico)
      },
    },
    {
      title: "Canasto Matero Tejido en Palma Caranday",
      slug: "canasto-matero-tejido-palma-caranday",
      categorySlug: "artesanias-y-decoracion",
      description:
        "Canasto matero reforzado tejido a mano en fibra natural de palma caranday con divisiones internas para termo y equipo completo.",
      ingredients: null,
      expiresAt: null,
      image: {
        relativePath: "products/2026/11/seed-canasto-caranday",
        width: 800,
        height: 1200, // Aspect ratio 2:3 (Vertical alto estilo Pinterest)
      },
    },
    {
      title: "Ruana Liviana de Algodón Rústico Tejida en Telar",
      slug: "ruana-liviana-algodon-rustico-telar",
      categorySlug: "textil-e-indumentaria",
      description:
        "Prenda artesanal tejida en telar criollo con algodón puro en tonos tierra y verde salvia. Ideal para media estación.",
      ingredients: null,
      expiresAt: null,
      image: {
        relativePath: "products/2026/11/seed-ruana-telar",
        width: 960,
        height: 1200, // Aspect ratio 4:5 (Retrato corto)
      },
    },
    {
      title: "Kit Huerta Aromática en Macetas Biodegradables (x4)",
      slug: "kit-huerta-aromatica-macetas-biodegradables",
      categorySlug: "vivero-y-jardineria",
      description:
        "Incluye plantines orgánicos de romero, albahaca, menta peperina y orégano listos para trasplantar, con sustrato abonado.",
      ingredients: null,
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Oferta temporal (+3 días)
      image: {
        relativePath: "products/2026/11/seed-kit-aromaticas",
        width: 1080,
        height: 1080, // Aspect ratio 1:1 (Cuadrado)
      },
    },
    {
      title: "Tabla de Algarrobo para Asado con Canaleta y Grabado",
      slug: "tabla-algarrobo-asado-grabado-personalizado",
      categorySlug: "artesanias-y-decoracion",
      description:
        "Tabla maciza de algarrobo estacionado (50x30 cm), curada con cera de abejas natural. Incluye grabado personalizado a pedido.",
      ingredients: null,
      expiresAt: null,
      image: {
        relativePath: "products/2026/11/seed-tabla-algarrobo",
        width: 1200,
        height: 900, // Aspect ratio 4:3 (Horizontal)
      },
    },
  ] as const;

  for (const item of sampleProducts) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoría no encontrada para slug: ${item.categorySlug}`);
    }

    const product = await db.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        ingredients: item.ingredients,
        categoryId,
        entrepreneurId: demoEntrepreneur.id,
        status: ProductStatus.APPROVED,
        approvedAt: now,
        approvedById: adminUser.id,
        expiresAt: item.expiresAt,
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        ingredients: item.ingredients,
        categoryId,
        entrepreneurId: demoEntrepreneur.id,
        status: ProductStatus.APPROVED,
        approvedAt: now,
        approvedById: adminUser.id,
        expiresAt: item.expiresAt,
      },
    });

    // Reemplazamos las imágenes de prueba del producto para mantener idempotencia
    await db.productImage.deleteMany({
      where: { productId: product.id },
    });

    await db.productImage.create({
      data: {
        productId: product.id,
        relativePath: item.image.relativePath,
        width: item.image.width,
        height: item.image.height,
        sortOrder: 0,
        isPrimary: true,
      },
    });

    await generateSeedWebpVariants(
      item.image.relativePath,
      item.image.width,
      item.image.height,
      item.categorySlug.toUpperCase(),
      "#DDE6DF",
    );

    console.log(
      `  • Producto cargado: ${product.title} [${item.image.width}x${item.image.height}]`,
    );
  }

  // 5. Registro de auditoría inicial
  const existingAuditCount = await db.auditLog.count({
    where: {
      entityType: AuditEntityType.ENTREPRENEUR,
      entityId: demoEntrepreneur.id,
    },
  });

  if (existingAuditCount === 0) {
    await db.auditLog.create({
      data: {
        actorUserId: adminUser.id,
        entityType: AuditEntityType.ENTREPRENEUR,
        entityId: demoEntrepreneur.id,
        action: "SEED_APPROVE",
        metadata: {
          note: "Alta inicial de emprendedor y productos de prueba para desarrollo.",
        },
      },
    });
  }

  console.log("✅ Seed completado con éxito.");
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
