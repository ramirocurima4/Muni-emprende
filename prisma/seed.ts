import "dotenv/config";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db, pool } from "../src/lib/db";

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
  console.log("🌱 Iniciando seed limpio de producción — MuniEmprende San Roque...");

  const superadminUsername = process.env.SUPERADMIN_USERNAME?.trim();
  const superadminPassword = process.env.SUPERADMIN_PASSWORD?.trim();

  if (!superadminUsername || !superadminPassword) {
    throw new Error(
      "Falta definir SUPERADMIN_USERNAME y SUPERADMIN_PASSWORD en el archivo .env antes de ejecutar el seed.",
    );
  }

  if (superadminPassword.length < 8) {
    throw new Error(
      "SUPERADMIN_PASSWORD debe tener al menos 8 caracteres para la cuenta maestra.",
    );
  }

  const passwordHash = await bcrypt.hash(superadminPassword, 12);

  // 1. Cuenta maestra Superadmin (Dirección de Modernización)
  const superadmin = await db.user.upsert({
    where: { username: superadminUsername },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      username: superadminUsername,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(
    `✔ Superadmin de Modernización listo: @${superadmin.username} (${superadmin.role})`,
  );

  // 2. Categorías Oficiales del Catálogo
  for (const cat of INITIAL_CATEGORIES) {
    await db.category.upsert({
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
  }
  console.log(`✔ ${INITIAL_CATEGORIES.length} categorías oficiales verificadas.`);

  // 3. Configuración Institucional por defecto (sin pisar ediciones previas si ya existe)
  await db.systemConfig.upsert({
    where: { key: "institutional" },
    update: {},
    create: {
      key: "institutional",
      employmentWhatsapp: "5493794819378",
      productionWhatsapp: "5493794819378",
      expoSchedule: "17:00 a 21:00 hs",
      expoLocation: "Plaza Libertad",
      mercadoSchedule: "08:00 a 13:00 hs",
      mercadoLocation: "Plaza Libertad",
      authorityName: "Cr. Raúl Pelozo",
      authorityTitle: "Intendente de San Roque",
      legalDisclaimer:
        "La Municipalidad de San Roque brinda únicamente este espacio de difusión publicitaria y no interviene en precios, medios de pago, entregas ni garantías comerciales.",
      updatedById: superadmin.id,
    },
  });

  await Promise.all([
    db.fairConfig.upsert({
      where: { fairType: "EXPO_EMPRENDEDORES" },
      update: {},
      create: {
        fairType: "EXPO_EMPRENDEDORES",
        schedule: "17:00 a 21:00 hs",
        location: "Plaza Libertad",
        whatsappNumber: "5493794819378",
        updatedById: superadmin.id,
      },
    }),
    db.fairConfig.upsert({
      where: { fairType: "MERCADO_SANROQUENO" },
      update: {},
      create: {
        fairType: "MERCADO_SANROQUENO",
        schedule: "08:00 a 13:00 hs",
        location: "Plaza Libertad",
        whatsappNumber: "5493794819378",
        updatedById: superadmin.id,
      },
    }),
  ]);
  console.log("✔ Configuración institucional inicial verificada.");
  console.log("✅ Seed limpio completado (sin emprendedores, productos ni fotos de prueba).");
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
