import "dotenv/config";
import {
  EntrepreneurStatus,
  FairMediaType,
  FairType,
  ProductStatus,
  UserRole,
} from "@prisma/client";
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

function addDaysUtc(daysFromNow: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

async function main() {
  console.log(
    "🎭 Iniciando carga de datos de DEMOSTRACIÓN — MuniEmprende San Roque...",
  );

  const superadminUsername =
    process.env.SUPERADMIN_USERNAME?.trim() || "modernizacion";
  const superadminPassword =
    process.env.SUPERADMIN_PASSWORD?.trim() || "SanRoque2026!";

  const superadminHash = await bcrypt.hash(superadminPassword, 12);
  const demoUserHash = await bcrypt.hash("Emprendedor2026!", 12);

  // 1. Asegurar cuenta maestra Superadmin
  const superadmin = await db.user.upsert({
    where: { username: superadminUsername },
    update: {
      passwordHash: superadminHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      username: superadminUsername,
      email: "modernizacion@munisanroque.gob.ar",
      passwordHash: superadminHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`✔ Superadmin verificado: @${superadmin.username}`);

  // 2. Categorías oficiales
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

  // 3. Configurar SystemConfig y FairConfig con fechas próximas realistas y teléfonos de prueba
  const nextExpoDate = addDaysUtc(4);
  const nextMercadoDate = addDaysUtc(6);
  const expoMapsUrl = "https://maps.google.com/?q=Plaza+Libertad+San+Roque+Corrientes";

  await db.systemConfig.upsert({
    where: { key: "institutional" },
    update: {
      employmentWhatsapp: "5493794819378",
      productionWhatsapp: "5493794654321",
      expoNextDate: nextExpoDate,
      expoSchedule: "17:30 a 22:00 hs",
      expoLocation: "Plaza Libertad (Frente al Municipio)",
      expoMapsUrl,
      mercadoNextDate: nextMercadoDate,
      mercadoSchedule: "08:00 a 12:30 hs",
      mercadoLocation: "Plaza Libertad (Sector Pérgola Central)",
      mercadoMapsUrl: expoMapsUrl,
      authorityName: "Cr. Raúl Pelozo",
      authorityTitle: "Intendente de San Roque",
      updatedById: superadmin.id,
    },
    create: {
      key: "institutional",
      employmentWhatsapp: "5493794819378",
      productionWhatsapp: "5493794654321",
      expoNextDate: nextExpoDate,
      expoSchedule: "17:30 a 22:00 hs",
      expoLocation: "Plaza Libertad (Frente al Municipio)",
      expoMapsUrl,
      mercadoNextDate: nextMercadoDate,
      mercadoSchedule: "08:00 a 12:30 hs",
      mercadoLocation: "Plaza Libertad (Sector Pérgola Central)",
      mercadoMapsUrl: expoMapsUrl,
      authorityName: "Cr. Raúl Pelozo",
      authorityTitle: "Intendente de San Roque",
      updatedById: superadmin.id,
    },
  });

  await Promise.all([
    db.fairConfig.upsert({
      where: { fairType: FairType.EXPO_EMPRENDEDORES },
      update: {
        nextDate: nextExpoDate,
        schedule: "17:30 a 22:00 hs",
        location: "Plaza Libertad (Frente al Municipio)",
        mapsUrl: expoMapsUrl,
        whatsappNumber: "5493794819378",
        updatedById: superadmin.id,
      },
      create: {
        fairType: FairType.EXPO_EMPRENDEDORES,
        nextDate: nextExpoDate,
        schedule: "17:30 a 22:00 hs",
        location: "Plaza Libertad (Frente al Municipio)",
        mapsUrl: expoMapsUrl,
        whatsappNumber: "5493794819378",
        updatedById: superadmin.id,
      },
    }),
    db.fairConfig.upsert({
      where: { fairType: FairType.MERCADO_SANROQUENO },
      update: {
        nextDate: nextMercadoDate,
        schedule: "08:00 a 12:30 hs",
        location: "Plaza Libertad (Sector Pérgola Central)",
        mapsUrl: expoMapsUrl,
        whatsappNumber: "5493794654321",
        updatedById: superadmin.id,
      },
      create: {
        fairType: FairType.MERCADO_SANROQUENO,
        nextDate: nextMercadoDate,
        schedule: "08:00 a 12:30 hs",
        location: "Plaza Libertad (Sector Pérgola Central)",
        mapsUrl: expoMapsUrl,
        whatsappNumber: "5493794654321",
        updatedById: superadmin.id,
      },
    }),
  ]);
  console.log("✔ SystemConfig y cartelera de próximas ferias actualizadas.");

  // 4. Crear 6 emprendimientos ficticios de San Roque
  const demoEntrepreneurs = [
    {
      username: "sabores_del_rio",
      role: UserRole.USER_TRUSTED,
      businessName: "Sabores del Río",
      slug: "sabores-del-rio",
      ownerName: "Miriam Gómez",
      whatsappNumber: "5493794112233",
      neighborhood: "Barrio Norte",
      bio: "Cocina típica sanroqueña elaborada en el día: chipá de almidón casero, mbeyú, pan de campo al horno de barro y empanadas de pescado fresco del río Santa Lucía.",
      avatarPath:
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
      hasPickup: true,
      hasDelivery: true,
      atFair: true,
      isTrusted: true,
      status: EntrepreneurStatus.APPROVED,
    },
    {
      username: "artesanias_ibera",
      role: UserRole.USER_TRUSTED,
      businessName: "Artesanías Iberá",
      slug: "artesanias-ibera",
      ownerName: "Ramón Miño",
      whatsappNumber: "5493794223344",
      neighborhood: "Centro",
      bio: "Taller familiar de talabartería, mates cincelados, cuchillería criolla y cestería en palma caranday con maderas nativas recuperadas.",
      avatarPath:
        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=600&q=80",
      hasPickup: true,
      hasDelivery: false,
      atFair: true,
      isTrusted: true,
      status: EntrepreneurStatus.APPROVED,
    },
    {
      username: "huerta_sanroquena",
      role: UserRole.USER_TRUSTED,
      businessName: "Huerta Sanroqueña",
      slug: "huerta-sanroquena",
      ownerName: "Familia Ojeda",
      whatsappNumber: "5493794334455",
      neighborhood: "Barrio Sur",
      bio: "Producción primaria agroecológica de San Roque: verduras de hoja recién cosechadas, mandioca tierna, huevos caseros de granja y plantines cítricos.",
      avatarPath:
        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80",
      hasPickup: true,
      hasDelivery: true,
      atFair: true,
      isTrusted: true,
      status: EntrepreneurStatus.APPROVED,
    },
    {
      username: "dulces_abuela",
      role: UserRole.USER_NEW,
      businessName: "Dulces de la Abuela",
      slug: "dulces-de-la-abuela",
      ownerName: "Graciela Ledesma",
      whatsappNumber: "5493794445566",
      neighborhood: "Barrio Estación",
      bio: "Conservas y dulces regionales en olla de cobre con recetas tradicionales correntinas: mamón en almíbar, guayaba, quinoto y dulce de leche casero.",
      avatarPath:
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
      hasPickup: true,
      hasDelivery: true,
      atFair: false,
      isTrusted: false,
      status: EntrepreneurStatus.APPROVED,
    },
    {
      username: "textil_correntino",
      role: UserRole.USER_TRUSTED,
      businessName: "Textil Correntino",
      slug: "textil-correntino",
      ownerName: "Lucía Benítez",
      whatsappNumber: "5493794556677",
      neighborhood: "Barrio San Cayetano",
      bio: "Tejidos artesanales en telar, ponchos livianos, caminos de mesa, delantales bordados y prendas de algodón confeccionadas en San Roque.",
      avatarPath:
        "https://images.unsplash.com/photo-1584992236310-6edddc08a323?auto=format&fit=crop&w=600&q=80",
      hasPickup: true,
      hasDelivery: false,
      atFair: true,
      isTrusted: true,
      status: EntrepreneurStatus.APPROVED,
    },
    {
      username: "nuevo_puesto_sr",
      role: UserRole.USER_NEW,
      businessName: "Nuevo Puesto San Roque",
      slug: "nuevo-puesto-san-roque",
      ownerName: "Matías Cáceres",
      whatsappNumber: "5493794667788",
      neighborhood: "Barrio San José",
      bio: "Emprendimiento joven de panificados integrales, alfajores de maicena y pastelería artesanal para eventos familiares. (Cuenta de prueba en estado PENDIENTE para moderación en /admin).",
      avatarPath:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
      hasPickup: true,
      hasDelivery: true,
      atFair: true,
      isTrusted: false,
      status: EntrepreneurStatus.PENDING,
    },
  ] as const;

  const entrepreneurIdBySlug = new Map<string, string>();

  for (const item of demoEntrepreneurs) {
    const user = await db.user.upsert({
      where: { username: item.username },
      update: {
        role: item.role,
        isActive: true,
      },
      create: {
        username: item.username,
        passwordHash: demoUserHash,
        role: item.role,
        isActive: true,
      },
    });

    const isApproved = item.status === EntrepreneurStatus.APPROVED;

    const entrepreneur = await db.entrepreneur.upsert({
      where: { slug: item.slug },
      update: {
        businessName: item.businessName,
        ownerName: item.ownerName,
        whatsappNumber: item.whatsappNumber,
        neighborhood: item.neighborhood,
        bio: item.bio,
        avatarPath: item.avatarPath,
        hasPickup: item.hasPickup,
        hasDelivery: item.hasDelivery,
        atFair: item.atFair,
        isTrusted: item.isTrusted,
        status: item.status,
        approvedAt: isApproved ? new Date() : null,
        approvedById: isApproved ? superadmin.id : null,
      },
      create: {
        userId: user.id,
        businessName: item.businessName,
        slug: item.slug,
        ownerName: item.ownerName,
        whatsappNumber: item.whatsappNumber,
        neighborhood: item.neighborhood,
        bio: item.bio,
        avatarPath: item.avatarPath,
        hasPickup: item.hasPickup,
        hasDelivery: item.hasDelivery,
        atFair: item.atFair,
        isTrusted: item.isTrusted,
        status: item.status,
        approvedAt: isApproved ? new Date() : null,
        approvedById: isApproved ? superadmin.id : null,
      },
    });

    entrepreneurIdBySlug.set(item.slug, entrepreneur.id);
  }
  console.log(
    `✔ ${entrepreneurIdBySlug.size} emprendimientos creados (5 aprobados + 1 pendiente para /admin).`,
  );

  // 5. Crear 12 productos variados con imágenes reales de Unsplash
  const demoProducts = [
    {
      entrepreneurSlug: "sabores-del-rio",
      categorySlug: "gastronomia",
      title: "Bandeja Matera: Chipá de Almidón y Mbeyú Tradicional",
      slug: "bandeja-matera-chipa-y-mbeyu-tradicional",
      description:
        "Bandeja recién horneada ideal para compartir la tarde del mate. Elaborada con fécula de mandioca misionera/correntina, queso criollo estacionado y leche entera de tambo local.",
      ingredients:
        "• Chipá clásico de tres quesos (docena)\n• Chipá relleno con jamón y queso criollo\n• Mbeyú tradicional a la sartén de hierro\n• Tortas parrilleras calentitas",
      isCombo: true,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 675,
    },
    {
      entrepreneurSlug: "sabores-del-rio",
      categorySlug: "gastronomia",
      title: "Docena de Empanadas Costeras al Horno de Barro",
      slug: "docena-empanadas-costeras-horno-de-barro",
      description:
        "Empanadas caseras de masa criolla amasada a mano y cocidas a leña de espinillo. Podés armar tu docena o media docena combinando los sabores del día.",
      ingredients:
        "• Surubí desmenuzado con morrón asado y verdeo\n• Carne cortada a cuchillo suave o picante\n• Pollo de campo al disco\n• Queso criollo y cebolla caramelizada",
      isCombo: true,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 1125,
    },
    {
      entrepreneurSlug: "sabores-del-rio",
      categorySlug: "gastronomia",
      title: "Pan Casero de Campo con Chicharrón al Horno a Leña",
      slug: "pan-casero-de-campo-con-chicharron",
      description:
        "Hogaza grande de pan casero con corteza dorada y miga tierna, horneada temprano cada mañana. (Marcado como PAUSED / Agotado hoy para demostración).",
      ingredients:
        "Harina 000, masa madre natural, grasa vacuna refinada, chicharrón criollo y sal.",
      isCombo: false,
      status: ProductStatus.PAUSED,
      imageUrl:
        "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 720,
    },
    {
      entrepreneurSlug: "dulces-de-la-abuela",
      categorySlug: "gastronomia",
      title: "Dulce de Mamón Casero en Almíbar Especiado",
      slug: "dulce-de-mamon-casero-en-almibar",
      description:
        "Láminas de mamón sanroqueño cocidas lentamente durante dos días en almíbar cristalino con clavo de olor y cáscara de naranja. Frasco esterilizado de 500 g.",
      ingredients:
        "Mamón verde seleccionado de quintas locales, azúcar, agua, clavo de olor y piel de naranja.",
      isCombo: false,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 900,
    },
    {
      entrepreneurSlug: "dulces-de-la-abuela",
      categorySlug: "gastronomia",
      title: "Combo Dulcero Regional Correntino (Frascos a Elección)",
      slug: "combo-dulcero-regional-correntino",
      description:
        "Caja de degustación con 3 frascos artesanales a elección para regalar o disfrutar en desayunos y postres con queso criollo.",
      ingredients:
        "• Dulce de mamón en almíbar\n• Mermelada de guayaba rosada sin semillas\n• Naranja agria en cascos\n• Quinotos al rhum\n• Dulce de leche casero colonial",
      isCombo: true,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 1100,
    },
    {
      entrepreneurSlug: "huerta-sanroquena",
      categorySlug: "gastronomia",
      title: "Bolsones de Verdura Fresca de Quinta y Huevos Caseros",
      slug: "bolson-verdura-fresca-y-huevos-caseros",
      description:
        "Cosechado la misma mañana de entrega en nuestra chacra de Barrio Sur, libre de agroquímicos. Consultá por WhatsApp para reservar tu bolsón semanal.",
      ingredients:
        "• Mazo de acelga, lechuga criolla y rúcula\n• Mandioca tierna pelada lista para hervir (2 kg)\n• Cebollita de verdeo, perejil y morrón\n• Media docena de huevos caseros de gallinas libres",
      isCombo: true,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 675,
    },
    {
      entrepreneurSlug: "huerta-sanroquena",
      categorySlug: "vivero-y-jardineria",
      title: "Plantines de Aromáticas y Cítricos Injertados",
      slug: "plantines-aromaticas-y-citricos-injertados",
      description:
        "Plantines vigorosos aclimatados al suelo de San Roque: romero, orégano, menta peperina, cedrón, limonero cuatro estaciones y naranjo dulce.",
      ingredients: null,
      isCombo: false,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 1125,
    },
    {
      entrepreneurSlug: "artesanias-ibera",
      categorySlug: "artesanias-y-decoracion",
      title: "Mate Imperial de Calabaza Forrado en Cuero Cincelado",
      slug: "mate-imperial-calabaza-cuero-cincelado",
      description:
        "Mate de calabaza gruesa seleccionada, forrado en cuero vacuno legítimo cosido a mano con lezna y virola cincelada con motivos del Iberá.",
      ingredients: null,
      isCombo: false,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 900,
    },
    {
      entrepreneurSlug: "artesanias-ibera",
      categorySlug: "artesanias-y-decoracion",
      title: "Canasto Matero Reforzado en Cuero y Palma Caranday",
      slug: "canasto-matero-cuero-y-palma-caranday",
      description:
        "Matera rígida artesanal con división interna para termo de litro, mate, yerbera y bombilla. Costuras en tiento de potro de máxima durabilidad.",
      ingredients: null,
      isCombo: false,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 750,
    },
    {
      entrepreneurSlug: "artesanias-ibera",
      categorySlug: "artesanias-y-decoracion",
      title: "Tabla Asadora en Madera de Algarrobo con Canaleta",
      slug: "tabla-asadora-madera-algarrobo",
      description:
        "Tabla maciza de algarrobo estacionado y curado con cera de abejas natural. Ideal para asados familiares o picadas regionales. Se realizan grabados personalizados.",
      ingredients: null,
      isCombo: false,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 675,
    },
    {
      entrepreneurSlug: "textil-correntino",
      categorySlug: "textil-e-indumentaria",
      title: "Ruana y Chalina Tejida en Telar Manual de Algodón",
      slug: "ruana-y-chalina-tejida-en-telar-manual",
      description:
        "Prenda liviana y abrigada tejida hilo por hilo en telar María con algodón rústico y guarda pampa tradicional en tonos tierra y verde monte.",
      ingredients: null,
      isCombo: false,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 1125,
    },
    {
      entrepreneurSlug: "textil-correntino",
      categorySlug: "textil-e-indumentaria",
      title: "Juego de Camino de Mesa e Individuales Bordados",
      slug: "juego-camino-de-mesa-e-individuales-bordados",
      description:
        "Conjunto textil en lienzo de algodón prelavado con detalles bordados a mano inspirados en la flora de los esteros correntinos. Incluye camino central y 4 individuales.",
      ingredients: null,
      isCombo: false,
      status: ProductStatus.APPROVED,
      imageUrl:
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
      width: 900,
      height: 720,
    },
  ] as const;

  for (const prod of demoProducts) {
    const entrepreneurId = entrepreneurIdBySlug.get(prod.entrepreneurSlug);
    const categoryId = categoryMap.get(prod.categorySlug);

    if (!entrepreneurId || !categoryId) {
      throw new Error(
        `No se encontró emprendedor (${prod.entrepreneurSlug}) o categoría (${prod.categorySlug}).`,
      );
    }

    const isApproved =
      prod.status === ProductStatus.APPROVED ||
      prod.status === ProductStatus.PAUSED;

    const savedProduct = await db.product.upsert({
      where: { slug: prod.slug },
      update: {
        entrepreneurId,
        categoryId,
        title: prod.title,
        description: prod.description,
        ingredients: prod.ingredients,
        isCombo: prod.isCombo,
        status: prod.status,
        approvedAt: isApproved ? new Date() : null,
        approvedById: isApproved ? superadmin.id : null,
      },
      create: {
        entrepreneurId,
        categoryId,
        title: prod.title,
        slug: prod.slug,
        description: prod.description,
        ingredients: prod.ingredients,
        isCombo: prod.isCombo,
        status: prod.status,
        approvedAt: isApproved ? new Date() : null,
        approvedById: isApproved ? superadmin.id : null,
      },
    });

    await db.productImage.deleteMany({
      where: { productId: savedProduct.id },
    });

    await db.productImage.create({
      data: {
        productId: savedProduct.id,
        relativePath: prod.imageUrl,
        width: prod.width,
        height: prod.height,
        sortOrder: 0,
        isPrimary: true,
      },
    });
  }
  console.log(
    `✔ ${demoProducts.length} productos variados creados (incluyendo combos con variedades y 1 pausado "Agotado hoy").`,
  );

  // 6. Crear 4 crónicas de feria (2 EXPO_EMPRENDEDORES y 2 MERCADO_SANROQUENO)
  await db.fairAlbum.deleteMany({
    where: {
      title: {
        in: [
          "Gran tarde de sol, mate y elaboración sanroqueña en Plaza Libertad",
          "Edición Especial Día de la Familia: récord de stands gastronómicos y artesanos",
          "Mañana de cosecha fresca del campo a la mesa en el Mercado Sanroqueño",
          "Productores de Barrio Sur y chacras vecinas acercaron verduras y dulces caseros",
        ],
      },
    },
  });

  const demoChronicles = [
    {
      fairType: FairType.EXPO_EMPRENDEDORES,
      title:
        "Gran tarde de sol, mate y elaboración sanroqueña en Plaza Libertad",
      eventDate: addDaysUtc(-7),
      location: "Plaza Libertad — San Roque",
      description:
        "Más de 35 familias emprendedoras compartieron sus creaciones en gastronomía típica, talabartería, tejidos y vivero. Vecinos y visitantes recorrieron el paseo acompañados por música chamamecera en vivo.",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 800,
        },
        {
          url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 800,
        },
      ],
    },
    {
      fairType: FairType.EXPO_EMPRENDEDORES,
      title:
        "Edición Especial Día de la Familia: récord de stands gastronómicos y artesanos",
      eventDate: addDaysUtc(-21),
      location: "Predio del Balneario Municipal",
      description:
        "Una jornada inolvidable a orillas del río Santa Lucía donde los talleres de artesanías en cuero, madera e indumentaria local agotaron su producción junto al patio de comidas regionales.",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 800,
        },
        {
          url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 800,
        },
      ],
    },
    {
      fairType: FairType.MERCADO_SANROQUENO,
      title:
        "Mañana de cosecha fresca del campo a la mesa en el Mercado Sanroqueño",
      eventDate: addDaysUtc(-5),
      location: "Plaza Libertad — Sector Pérgola",
      description:
        "Desde las 8 de la mañana los pequeños productores hortícolas y granjeros de San Roque ofrecieron verduras de hoja recién cortadas, mandioca tierna, cítricos y huevos caseros sin intermediarios.",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 800,
        },
        {
          url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 800,
        },
      ],
    },
    {
      fairType: FairType.MERCADO_SANROQUENO,
      title:
        "Productores de Barrio Sur y chacras vecinas acercaron verduras y dulces caseros",
      eventDate: addDaysUtc(-19),
      location: "Plaza Libertad — San Roque",
      description:
        "Con gran acompañamiento de los vecinos, el Mercado Sanroqueño fortaleció la soberanía alimentaria local destacando la producción agroecológica, miel pura de monte y conservas tradicionales.",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 800,
        },
        {
          url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 800,
        },
      ],
    },
  ] as const;

  for (const chronicle of demoChronicles) {
    await db.fairAlbum.create({
      data: {
        fairType: chronicle.fairType,
        title: chronicle.title,
        eventDate: chronicle.eventDate,
        location: chronicle.location,
        description: chronicle.description,
        isPublished: true,
        uploadedById: superadmin.id,
        media: {
          create: chronicle.photos.map((photo, index) => ({
            mediaType: FairMediaType.IMAGE,
            relativePath: photo.url,
            width: photo.width,
            height: photo.height,
            sortOrder: index,
          })),
        },
      },
    });
  }
  console.log(
    `✔ ${demoChronicles.length} crónicas de feria creadas (2 Expo Emprendedores + 2 Mercado Sanroqueño).`,
  );

  console.log(
    "✅ Demo de MuniEmprende cargada con éxito. Para limpiar y volver a producción vacía usá: npm run demo:clean",
  );
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando seed-demo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
